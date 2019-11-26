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
import * as url from 'url';

import {
	DEFAULT_MAX_PEER_INFO_SIZE,
	FORBIDDEN_CONNECTION,
	FORBIDDEN_CONNECTION_REASON,
	INCOMPATIBLE_PEER_CODE,
	INCOMPATIBLE_PEER_INFO_CODE,
	INCOMPATIBLE_PEER_UNKNOWN_REASON,
	INVALID_CONNECTION_QUERY_CODE,
	INVALID_CONNECTION_QUERY_REASON,
	INVALID_CONNECTION_SELF_CODE,
	INVALID_CONNECTION_SELF_REASON,
	INVALID_CONNECTION_URL_CODE,
	INVALID_CONNECTION_URL_REASON,
} from '../constants';
import { PeerInboundHandshakeError } from '../errors';
import { EVENT_FAILED_TO_ADD_INBOUND_PEER } from '../events';
import {
	constructPeerId,
	validatePeerCompatibility,
	validatePeerInfo,
} from '../utils';

import { REQUEST_NODE_CONFIG } from './constants';
import { NodeConfig, ProcessMessage, SocketInfo } from './type';

const BASE_10_RADIX = 10;

class Worker extends SCWorker {
	private readonly _socketMap: Map<string, SCServerSocket> = new Map();
	private _nodeConfig?: NodeConfig;

	public async run(): Promise<void> {
		// Get config from master
		this._nodeConfig = await this._sendToServer<void, NodeConfig>({
			type: REQUEST_NODE_CONFIG,
		});

		this.scServer.on('handshake', (socket: SCServerSocket) => {
			(socket as any).socket.on('ping', () => {
				(socket as any).socket.terminate();

				return;
			});
			// Terminate the connection the moment it receive pong frame
			(socket as any).socket.on('pong', () => {
				(socket as any).socket.terminate();

				return;
			});

			if (this._nodeConfig?.bannedPeers.includes(socket.remoteAddress)) {
				this._disconnectSocketDueToFailedHandshake(
					socket,
					FORBIDDEN_CONNECTION,
					FORBIDDEN_CONNECTION_REASON,
				);

				return;
			}
			// Check blacklist to avoid incoming connections from backlisted ips
			if (this._nodeConfig?.blacklistedPeers.includes(socket.remoteAddress)) {
				this._disconnectSocketDueToFailedHandshake(
					socket,
					FORBIDDEN_CONNECTION,
					FORBIDDEN_CONNECTION_REASON,
				);

				return;
			}
		});

		this.scServer.on('connection', async (socket: SCServerSocket) => {
			if (!socket.request.url) {
				this._disconnectSocketDueToFailedHandshake(
					socket,
					INVALID_CONNECTION_URL_CODE,
					INVALID_CONNECTION_URL_REASON,
				);

				return;
			}
			const queryObject = url.parse(socket.request.url, true).query;

			if ((queryObject.nonce as string) === this._nodeConfig?.nonce) {
				this._disconnectSocketDueToFailedHandshake(
					socket,
					INVALID_CONNECTION_SELF_CODE,
					INVALID_CONNECTION_SELF_REASON,
				);

				return;
			}

			if (
				typeof queryObject.wsPort !== 'string' ||
				typeof queryObject.protocolVersion !== 'string' ||
				typeof queryObject.nethash !== 'string'
			) {
				this._disconnectSocketDueToFailedHandshake(
					socket,
					INVALID_CONNECTION_QUERY_CODE,
					INVALID_CONNECTION_QUERY_REASON,
				);

				return;
			}

			const remoteWSPort: number = parseInt(queryObject.wsPort, BASE_10_RADIX);
			const peerId = constructPeerId(socket.remoteAddress, remoteWSPort);

			// Remove these wsPort and ip from the query object
			const {
				// wsPort,
				// ipAddress,
				nethash,
				advertiseAddress,
			} = queryObject;

			const incomingPeerInfo = {
				peerId,
				ipAddress: socket.remoteAddress,
				wsPort: remoteWSPort,
				nethash,
				protocolVersion: queryObject.protocolVersion,
				advertiseAddress: advertiseAddress !== 'false',
			};

			try {
				validatePeerInfo(
					incomingPeerInfo,
					this._nodeConfig?.maxPeerInfoSize ?? DEFAULT_MAX_PEER_INFO_SIZE,
				);
			} catch (error) {
				this._disconnectSocketDueToFailedHandshake(
					socket,
					INCOMPATIBLE_PEER_INFO_CODE,
					error,
				);
			}

			const { success, error } = validatePeerCompatibility(
				incomingPeerInfo,
				this._nodeInfo,
			);

			if (!success) {
				const incompatibilityReason = error || INCOMPATIBLE_PEER_UNKNOWN_REASON;

				this._disconnectSocketDueToFailedHandshake(
					socket,
					INCOMPATIBLE_PEER_CODE,
					incompatibilityReason,
				);

				return;
			}
			this._socketMap.set(peerId, socket);
			try {
				const socketInfo: SocketInfo = {
					id: peerId,
					ipAddress: socket.remoteAddress,
					wsPort: remoteWSPort,
					protocolVersion: queryObject.protocolVersion,
					advertiseAddress: advertiseAddress !== 'false',
				};
				await this._sendToServer<SocketInfo, void>({
					type: 'connection',
					data: socketInfo,
				});
			} catch (err) {
				this.log(err);
			}
		});
	}

	private _disconnectSocketDueToFailedHandshake(
		socket: SCServerSocket,
		statusCode: number,
		closeReason: string,
	): void {
		socket.disconnect(statusCode, closeReason);
		this.emit(
			EVENT_FAILED_TO_ADD_INBOUND_PEER,
			new PeerInboundHandshakeError(closeReason, statusCode, socket.id),
		);
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
