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

// tslint:disable-next-line no-require-imports no-var-requires no-submodule-imports variable-name
const SCWorker = require('socketcluster/scworker');
import { SCServerSocket } from 'socketcluster-server';
import { ProcessMessage, NodeConfig } from './type';
import { REQUEST_NODE_CONFIG } from './constants';

interface SocketInfo {
	readonly id: string;
	readonly ipAddress: string;
	readonly wsPort: number;
	readonly socket: SCServerSocket;
}

class Worker extends SCWorker {
	private _socketMap: Map<string, SocketInfo> = new Map();
	private _nodeConfig?: NodeConfig;

	public async run(): Promise<void> {
		// Get config from master
		this._nodeConfig = await this._sendToServer<void, NodeConfig>({
			type: REQUEST_NODE_CONFIG,
		});
		this.scServer.on('connection', (socket: SCServerSocket) => {});
	}

	/**
	 * @param data data massage request as T
	 * @returns type of K
	 */
	private async _sendToServer<T, K>(data: ProcessMessage<T>): Promise<K> {
		return new Promise((resolve, reject) => {
			this.sendToMaster(data, (err: Error, res: K) => {
				if (err) {
					reject(err);

					return;
				}
				resolve(res);
			});
		});
	}
}

new Worker();
