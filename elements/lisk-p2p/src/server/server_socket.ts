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

import { MasterServer } from './master_server';

export interface SocketInfo {
	readonly id: string;
	readonly ipAddress: string;
	readonly wsPort: number;
}

export class ServerSocket extends EventEmitter {
	private readonly _id: string;
	private readonly _ipAddress: string;
	private readonly _wsPort: number;
	private readonly _workerId: number;
	private readonly _masterServer: MasterServer;

	public constructor(
		masterServer: MasterServer,
		workerId: number,
		socketInfo: SocketInfo,
	) {
		super();
		this._workerId = workerId;
		this._id = socketInfo.id;
		this._ipAddress = socketInfo.ipAddress;
		this._wsPort = socketInfo.wsPort;
		this._masterServer = masterServer;
	}

	public get id(): string {
		return this._id;
	}

	public get wsPort(): number {
		return this._wsPort;
	}

	public get ipAddress(): string {
		return this._ipAddress;
	}
}
