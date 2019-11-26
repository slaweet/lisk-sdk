/*
 * Copyright © 2019 Lisk Foundation
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Unless otherwise agreed in a custom licensing agreement with the Lisk Foundation,
 * no part of this software, including this file, may be copied, modified,
 * propagated, or distributed except according to the terms contained in the
 * LICENSE file.
 *
 * Removal or modification of this copyright notice is prohibited.
 *
 */
import { EventEmitter } from 'events';

import * as SocketCluster from 'socketcluster';

import { ProcessCallback, ProcessMessage, NodeConfig, WorkerMessage } from './type';
import { REQUEST_NODE_CONFIG, REQUEST_SOCKET_CONNECTION } from './constants';
import { ServerSocket, SocketInfo } from './server_socket';

interface MasterConfig {
	readonly wsPort: number;
	readonly workers: number;
	readonly path: string;
	// tslint:disable-next-line no-magic-numbers
	readonly logLevel: 0 | 1 | 2 | 3;
}

export class MasterServer extends EventEmitter {
	private readonly _config: MasterConfig;
	private readonly _nodeConfig: NodeConfig;
	private readonly _server: SocketCluster;
	private _socketMap: Map<string, ServerSocket>;

	public constructor(config: MasterConfig, nodeConfig: NodeConfig) {
		super();
		this._config = config;
		this._nodeConfig = nodeConfig;
		this._socketMap = new Map();

		this._server = new SocketCluster({
			port: config.wsPort,
			path: config.path,
			workers: config.workers ?? 1,
			logLevel: config.logLevel ?? 0,
		});
		this._server.on('workerMessage' as any, ((workerId: number, req: WorkerMessage, callback: ProcessCallback) => {
			if (req.type === REQUEST_NODE_CONFIG) {
				callback(undefined, this._nodeConfig);

				return;
			}
			if (req.type === REQUEST_SOCKET_CONNECTION) {
				const socket = new ServerSocket(this, workerId, req.data as SocketInfo);
				this._socketMap.set(req.id, socket);
				this.emit('connection', socket);
			}
			// Find a related socket and emit event
			const existingSocket = this._socketMap.get(req.id);
			existingSocket?.emit(req.type, req.data, callback);
		}) as any);
	}

	public async sendToWorker<T, K>(workerId: number, data: ProcessMessage<T>): Promise<ProcessMessage<K>> {
		return this._sendToWorker<T, K>(workerId, data);
	}

	private async _sendToWorker<T, K>(workerId: number, data: ProcessMessage<T>): Promise<ProcessMessage<K>> {
		return new Promise((resolve, reject) => {
			this._server.sendToWorker(workerId, data, (err: Error, resp: ProcessMessage<K>) => {
				if (err) {
					reject(err);

					return;
				}
				resolve(resp);
			});
		});
	}
}