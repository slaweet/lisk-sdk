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
const { stringToByte } = require('../utils/input_serializers');
const { NonSupportedOperationError } = require('../errors');
const filterTypes = require('../utils/filter_types');
const BaseEntity = require('./base_entity');

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
 * @property {string} [id]
 * @property {string} [id_eql]
 * @property {string} [id_ne]
 * @property {Array.<string>} [id_in]
 * @property {string} [id_like]
 * @property {string} [blockId]
 * @property {string} [blockId_eql]
 * @property {string} [blockId_ne]
 * @property {Array.<string>} [blockId_in]
 * @property {string} [blockId_like]
 * @property {string} [blockHeight]
 * @property {string} [blockHeight_eql]
 * @property {string} [blockHeight_ne]
 * @property {string} [blockHeight_gt]
 * @property {string} [blockHeight_gte]
 * @property {string} [blockHeight_lt]
 * @property {string} [blockHeight_lte]
 * @property {Array.<string>} [blockHeight_in]
 * @property {string} [type]
 * @property {string} [type_eql]
 * @property {string} [type_ne]
 * @property {string} [type_gt]
 * @property {string} [type_gte]
 * @property {string} [type_lt]
 * @property {string} [type_lte]
 * @property {Array.<string>} [type_in]
 * @property {string} [timestamp]
 * @property {string} [timestamp_eql]
 * @property {string} [timestamp_ne]
 * @property {string} [timestamp_gt]
 * @property {string} [timestamp_gte]
 * @property {string} [timestamp_lt]
 * @property {string} [timestamp_lte]
 * @property {Array.<string>} [timestamp_in]
 * @property {string} [senderPublicKey]
 * @property {string} [senderPublicKey_eql]
 * @property {string} [senderPublicKey_ne]
 * @property {Array.<string>} [senderPublicKey_in]
 * @property {string} [senderPublicKey_like]
 * @property {string} [senderId]
 * @property {string} [senderId_eql]
 * @property {string} [senderId_ne]
 * @property {Array.<string>} [senderId_in]
 * @property {string} [senderId_like]
 * @property {string} [recipientId]
 * @property {string} [recipientId_eql]
 * @property {string} [recipientId_ne]
 * @property {Array.<string>} [recipientId_in]
 * @property {string} [recipientId_like]
 * @property {string} [amount]
 * @property {string} [amount_eql]
 * @property {string} [amount_ne]
 * @property {string} [amount_gt]
 * @property {string} [amount_gte]
 * @property {string} [amount_lt]
 * @property {string} [amount_lte]
 * @property {Array.<string>} [amount_in]
 * @property {string} [fee]
 * @property {string} [fee_eql]
 * @property {string} [fee_ne]
 * @property {string} [fee_gt]
 * @property {string} [fee_gte]
 * @property {string} [fee_lt]
 * @property {string} [fee_lte]
 * @property {Array.<string>} [fee_in]
 */

const sqlFiles = {
	select: 'transactions/get.sql',
	selectExtended: 'transactions/get_extended.sql',
	isPersisted: 'transactions/is_persisted.sql',
	count: 'transactions/count.sql',
	count_all: 'transactions/count_all.sql',
};

class Transaction extends BaseEntity {
	/**
	 * Constructor
	 * @param {BaseAdapter} adapter - Adapter to retrive the data from
	 * @param {filters.Transaction} defaultFilters - Set of default filters applied on every query
	 */
	constructor(adapter, defaultFilters = {}) {
		super(adapter, defaultFilters);

		this.addField('rowId', 'string', {
			fieldName: 'trs.rowId',
		});

		this.addField('transferData', 'string', {
			fieldName: 'trs.transferData',
		});

		this.addField('id', 'string', {
			filter: filterTypes.TEXT,
			fieldName: 'trs.id',
		});

		this.addField('blockId', 'string', {
			filter: filterTypes.TEXT,
		});

		this.addField('blockHeight', 'string', {
			filter: filterTypes.NUMBER,
			fieldName: 'height',
		});

		this.addField('type', 'number', {
			filter: filterTypes.NUMBER,
		});

		this.addField('timestamp', 'number', {
			filter: filterTypes.NUMBER,
			fieldName: 'trs.timestamp',
		});

		this.addField(
			'senderPublicKey',
			'string',
			{
				filter: filterTypes.TEXT,
				format: 'publicKey',
			},
			stringToByte,
		);

		this.addField('senderId', 'string', {
			filter: filterTypes.TEXT,
		});

		this.addField('recipientId', 'string', {
			filter: filterTypes.TEXT,
		});

		this.addField('amount', 'string', {
			filter: filterTypes.NUMBER,
		});

		this.addField('fee', 'string', {
			filter: filterTypes.NUMBER,
		});

		this.addField('signature', 'string', {}, stringToByte);

		this.addField('signSignature', 'string', {}, stringToByte);

		this.addField('signatures', 'string');

		this.addField('asset', 'string');

		this.addFilter('data_like', filterTypes.CUSTOM, {
			// eslint-disable-next-line no-template-curly-in-string
			condition: '"transferData" LIKE ${data_like}',
		});

		this.addField('dapp_name', 'string', {
			fieldName: "trs.asset->'dapp'->>'name'",
			filter: filterTypes.CUSTOM,
			filterCondition:
				// eslint-disable-next-line no-template-curly-in-string
				'trs.asset @> \'{ "dapp": { "name": "${dapp_name:value}" } }\'::jsonb',
		});

		this.addFilter('dapp_link', filterTypes.CUSTOM, {
			condition:
				// eslint-disable-next-line no-template-curly-in-string
				'trs.asset @> \'{ "dapp": { "link": "${dapp_link:value}" } }\'::jsonb',
		});

		this.SQLs = this.loadSQLFiles('transaction', sqlFiles);
	}

	/**
	 * Get one transaction
	 *
	 * @param {filters.Transaction|filters.Transaction[]} [filters = {}]
	 * @param {Object} [options = {}] - Options to filter data
	 * @param {Number} [options.limit=10] - Number of records to fetch
	 * @param {Number} [options.offset=0] - Offset to start the records
	 * @param {string} [options.sort] - Sort key for transaction e.g. amount:asc, amount:desc
	 * @param {Boolean} [options.extended=false] - Get extended fields for entity
	 * @param {Object} tx - Database transaction object
	 * @return {Promise.<Transaction, Error>}
	 */
	getOne(filters, options = {}, tx) {
		const expectedResultCount = 1;
		return this._getResults(filters, options, tx, expectedResultCount);
	}

	/**
	 * Get list of transactions
	 *
	 * @param {filters.Transaction|filters.Transaction[]} [filters = {}]
	 * @param {Object} [options = {}] - Options to filter data
	 * @param {Number} [options.limit=10] - Number of records to fetch
	 * @param {Number} [options.offset=0] - Offset to start the records
	 * @param {string} [options.sort] - Sort key for transaction e.g. amount:asc, amount:desc
	 * @param {Boolean} [options.extended=false] - Get extended fields for entity
	 * @param {Object} tx - Database transaction object
	 * @return {Promise.<Transaction[], Error>}
	 */
	get(filters, options = {}, tx) {
		return this._getResults(filters, options, tx);
	}

	/**
	 * Count transactions
	 *
	 * @param {filters.Transaction|filters.Transaction[]} [filters = {}]
	 * @param {Object} [_options = {}] - Options to filter data
	 * @param {Object} [tx] - Database transaction object
	 * @return {Promise.<Transaction[], Error>}
	 */
	// eslint-disable-next-line no-unused-vars
	count(filters, _options = {}, tx) {
		this.validateFilters(filters);
		filters = Transaction._sanitizeFilters(filters);

		const mergedFilters = this.mergeFilters(filters);
		const parsedFilters = this.parseFilters(mergedFilters);

		const params = {
			parsedFilters,
		};
		const expectedResultCount = 1;

		const sql = parsedFilters === '' ? this.SQLs.count_all : this.SQLs.count;

		return this.adapter
			.executeFile(sql, params, { expectedResultCount }, tx)
			.then(data => +data.count);
	}

	/**
	 * Create transactions object
	 *
	 * @param {Transaction|Array.<Transaction>} data
	 * @param {Object} [_options]
	 * @param {Object} [tx] - Transaction object
	 * @return {*}
	 */
	// eslint-disable-next-line class-methods-use-this,no-unused-vars
	create(data, _options, tx) {
		throw new NonSupportedOperationError();
	}

	/**
	 * Update object record
	 *
	 * @override
	 * @throws {NonSupportedOperationError}
	 */
	// eslint-disable-next-line class-methods-use-this
	update() {
		throw new NonSupportedOperationError();
	}

	/**
	 * Update object record
	 *
	 * @override
	 * @throws {NonSupportedOperationError}
	 */
	// eslint-disable-next-line class-methods-use-this
	updateOne() {
		throw new NonSupportedOperationError();
	}

	/**
	 * Delete object record
	 *
	 * @override
	 * @throws {NonSupportedOperationError}
	 */
	// eslint-disable-next-line class-methods-use-this
	delete() {
		throw new NonSupportedOperationError();
	}

	/**
	 * Check if the record exists with following conditions
	 *
	 * @param {filters.Account} filters
	 * @param {Object} [_options]
	 * @param {Object} [tx]
	 * @returns {Promise.<boolean, Error>}
	 */
	isPersisted(filters, _options, tx) {
		const atLeastOneRequired = true;
		this.validateFilters(filters, atLeastOneRequired);
		const mergedFilters = this.mergeFilters(filters);
		const parsedFilters = this.parseFilters(mergedFilters);

		return this.adapter
			.executeFile(
				this.SQLs.isPersisted,
				{ parsedFilters },
				{ expectedResultCount: 1 },
				tx,
			)
			.then(result => result.exists);
	}

	_getResults(filters, options, tx, expectedResultCount = undefined) {
		filters = Transaction._sanitizeFilters(filters);
		this.validateFilters(filters);
		this.validateOptions(options);

		const mergedFilters = this.mergeFilters(filters);
		const parsedFilters = this.parseFilters(mergedFilters);

		const parsedOptions = _.defaults(
			{},
			_.pick(options, ['limit', 'offset', 'sort', 'extended']),
			_.pick(this.defaultOptions, ['limit', 'offset', 'sort', 'extended']),
		);

		// To have deterministic pagination add extra sorting
		if (parsedOptions.sort) {
			parsedOptions.sort = _.flatten([parsedOptions.sort, 'rowId:asc']).filter(
				Boolean,
			);
		} else {
			parsedOptions.sort = ['rowId:asc'];
		}

		let parsedSort = this.parseSort(parsedOptions.sort);

		// TODO: improve this logic
		parsedSort = parsedSort.replace('"rowId"', 'trs."rowId"');
		parsedSort = parsedSort.replace(
			'"dapp_name"',
			"trs.asset->'dapp'->>'name'",
		);

		const params = {
			limit: parsedOptions.limit,
			offset: parsedOptions.offset,
			parsedSort,
			parsedFilters,
		};

		return this.adapter
			.executeFile(
				parsedOptions.extended ? this.SQLs.selectExtended : this.SQLs.select,
				params,
				{ expectedResultCount },
				tx,
			)
			.then(resp => {
				const parseResponse = transaction => {
					transaction.asset = transaction.asset ? transaction.asset : {};

					/**
					 * Transaction types which still store amount and recipientId outside asset field
					 *
					 * Type 0 - TransferTransaction
					 * Type 3 - VoteTransaction
					 * Type 6 - InTransferTransaction
					 * Type 7 - OutTransferTransaction
					 * Type 8 - TransferTransaction (with networkIdentifier)
					 *
					 */
					const recipientTransactionTypes = [0, 3, 6, 7, 8];

					if (recipientTransactionTypes.includes(transaction.type)) {
						transaction.asset.amount = transaction.amount;
						transaction.asset.recipientId = transaction.recipientId;
					}

					if (transaction.transferData) {
						transaction.asset.data =
							transaction.transferData.toString('utf8') || null;
					}

					delete transaction.transferData;
					delete transaction.amount;
					delete transaction.recipientId;

					transaction.signatures = transaction.signatures
						? transaction.signatures.filter(Boolean)
						: [];
					return transaction;
				};

				if (expectedResultCount === 1) {
					return parseResponse(resp);
				}

				return resp.map(parseResponse);
			});
	}

	static _sanitizeFilters(filters = {}) {
		const sanitizeFilterObject = filterObject => {
			if (filterObject.data_like) {
				filterObject.data_like = Buffer.from(filterObject.data_like, 'utf8');
			}
			return filterObject;
		};

		// PostgresSQL does not support null byte buffer so have to parse in javascript
		if (Array.isArray(filters)) {
			filters = filters.map(sanitizeFilterObject);
		} else {
			filters = sanitizeFilterObject(filters);
		}

		return filters;
	}
}

module.exports = Transaction;
