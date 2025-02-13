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
 */

'use strict';

const _ = require('lodash');
const path = require('path');
const {
	entities: { Transaction: TransactionEntity },
} = require('../../../../../components/storage');

/**
 * Basic Transaction
 * @typedef {Object} BasicTransaction
 * @property {string} id
 * @property {string} blockId
 * @property {Integer} [height]
 * @property {Integer} [confirmations]
 * @property {Integer} type
 * @property {Number} timestamp
 * @property {string} senderPublicKey
 * @property {string} senderId
 * @property {string} recipientId
 * @property {string} amount
 * @property {string} fee
 * @property {string} signature
 * @property {string} signSignature
 * @property {Array.<string>} signatures
 * @property {Object} asset
 */

/**
 * Transfer Transaction
 * @typedef {BasicTransaction} TransferTransaction
 * @property {string} asset.data
 * @property {string} asset.amount
 * @property {string} asset.recipientId
 */

/**
 * Second Passphrase Transaction
 * @typedef {BasicTransaction} SecondPassphraseTransaction
 * @property {string} asset.publicKey
 */

/**
 * Delegate Transaction
 * @typedef {BasicTransaction} DelegateTransaction
 * @property {Object} asset
 * @property {string} asset.username
 */

/**
 * Vote Transaction
 * @typedef {BasicTransaction} VoteTransaction
 * @property {Array.<string>} asset.votes
 */

/**
 * Multisig Registration Transaction
 * @typedef {BasicTransaction} MultisigRegistrationTransaction
 * @property {Integer} asset.min
 * @property {Integer} asset.lifetime
 * @property {Array.<string>} asset.keysgroup
 */

/**
 * Dapp Registration Transaction
 * @typedef {BasicTransaction} DappRegistrationTransaction
 * @property {Object} asset.dapp
 * @property {Integer} asset.dapp.type
 * @property {string} asset.dapp.name
 * @property {string} asset.dapp.description
 * @property {string} asset.dapp.tags
 * @property {string} asset.dapp.link
 * @property {string} asset.dapp.icon
 * @property {Integer} asset.dapp.category
 */

/**
 * InTransfer Transaction
 * @typedef {BasicTransaction} InTransferTransaction
 * @property {Object} asset
 * @property {Object} asset.inTransfer
 * @property {string} asset.inTransfer.dappId
 */

/**
 * OutTransfer Transaction
 * @typedef {BasicTransaction} OutTransferTransaction
 * @property {Object} asset
 * @property {Object} asset.outTransfer
 * @property {string} asset.outTransfer.dappId
 * @property {string} asset.outTransfer.transactionId
 */

/**
 * Transaction
 * @typedef {(TransferTransaction|SecondPassphraseTransaction|DelegateTransaction|VoteTransaction|MultisigRegistrationTransaction|DappRegistrationTransaction|InTransferTransaction|OutTransferTransaction)} Transaction
 */

/**
 * Transaction Filters
 * @typedef {Object} filters.Transaction
 */

const sqlFiles = {
	create: 'transactions/create.sql',
};

const trsCreateFields = [
	'id',
	'blockId',
	'type',
	'timestamp',
	'senderPublicKey',
	'senderId',
	'recipientId',
	'amount',
	'fee',
	'signature',
	'signSignature',
	'signatures',
	'asset',
	'transferData',
];

class ChainTransaction extends TransactionEntity {
	/**
	 * Constructor
	 * @param {BaseAdapter} adapter - Adapter to retrive the data from
	 * @param {filters.Transaction} defaultFilters - Set of default filters applied on every query
	 */
	constructor(adapter, defaultFilters = {}) {
		super(adapter, defaultFilters);

		this.sqlDirectory = path.join(path.dirname(__filename), '../sql');

		this.SQLs = this.loadSQLFiles('transaction', sqlFiles, this.sqlDirectory);
	}

	/**
	 * Create transactions object
	 *
	 * @param {Transaction|Array.<Transaction>} data
	 * @param {Object} [_options]
	 * @param {Object} [tx] - Transaction object
	 * @return {*}
	 */
	create(data, _options, tx) {
		const transactions = ChainTransaction._sanitizeCreateData(data);

		const createSet = this.getValuesSet(transactions, trsCreateFields);

		return this.adapter.executeFile(
			this.SQLs.create,
			{ values: createSet, attributes: trsCreateFields },
			{ expectedResultCount: 0 },
			tx,
		);
	}

	static _sanitizeCreateData(data) {
		const transactions = Array.isArray(data)
			? _.cloneDeep(data)
			: [_.cloneDeep(data)];

		const recipientTransactionTypes = [0, 3, 8];

		transactions.forEach(transaction => {
			transaction.signatures = transaction.signatures
				? transaction.signatures.join()
				: null;

			if (recipientTransactionTypes.includes(transaction.type)) {
				transaction.amount = transaction.asset.amount.toString();
				transaction.recipientId = transaction.asset.recipientId;
			} else {
				transaction.recipientId = null;
				transaction.amount = 0;
			}

			transaction.fee = transaction.fee.toString();
			transaction.transferData = null;

			// Transfer data is bytea and can not be included as json when null byte is present
			const dataTransactionType = [0, 8];
			if (
				dataTransactionType.includes(transaction.type) &&
				transaction.asset &&
				transaction.asset.data
			) {
				transaction.transferData = Buffer.from(transaction.asset.data, 'utf8');
				delete transaction.asset;
			}

			// stringify should be done after converting asset.data into transferData
			transaction.asset = transaction.asset
				? JSON.stringify(transaction.asset)
				: null;
		});

		return transactions;
	}
}

module.exports = ChainTransaction;
