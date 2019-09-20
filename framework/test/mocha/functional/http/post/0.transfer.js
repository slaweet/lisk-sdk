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

require('../../functional');
const crypto = require('crypto');
const {
	transfer,
	utils: transactionUtils,
} = require('@liskhq/lisk-transactions');
const BigNum = require('@liskhq/bignum');
const accountFixtures = require('../../../fixtures/accounts');
const typesRepresentatives = require('../../../fixtures/types_representatives');
const phases = require('../../../common/phases');
const sendTransactionPromise = require('../../../common/helpers/api')
	.sendTransactionPromise;
const randomUtil = require('../../../common/utils/random');
const apiCodes = require('../../../../../src/modules/http_api/api_codes');

const specialChar = '❤';
const nullChar1 = '\0';
const nullChar2 = '\x00';
const nullChar3 = '\u0000';
const nullChar4 = '\\U00000000';

describe('POST /api/transactions (type 0) transfer funds', () => {
	let transaction;
	const goodTransaction = randomUtil.transaction();
	const badTransactions = [];
	const goodTransactions = [];
	// Low-frills deep copy
	const cloneGoodTransaction = JSON.parse(JSON.stringify(goodTransaction));

	const account = randomUtil.account();
	const accountOffset = randomUtil.account();

	describe('schema validations', () => {
		typesRepresentatives.allTypes.forEach(test => {
			it(`using ${test.description} should fail`, async () => {
				return sendTransactionPromise(test.input, 400).then(res => {
					expect(res).to.have.nested.property('body.message').that.is.not.empty;
				});
			});
		});

		it('with lowercase recipientId should fail', async () => {
			transaction = randomUtil.transaction();
			transaction.recipientId = transaction.recipientId.toLowerCase();
			transaction.signature = crypto.randomBytes(64).toString('hex');
			transaction.id = transactionUtils.getTransactionId(transaction);

			return sendTransactionPromise(transaction, 400).then(res => {
				expect(res.body.message).to.be.equal('Validation errors');
				badTransactions.push(transaction);
			});
		});
	});

	describe('transaction processing', () => {
		it('with invalid signature should fail', async () => {
			transaction = randomUtil.transaction();
			transaction.signature = crypto.randomBytes(64).toString('hex');
			transaction.id = transactionUtils.getTransactionId(transaction);

			return sendTransactionPromise(
				transaction,
				apiCodes.PROCESSING_ERROR,
			).then(res => {
				expect(res.body.message).to.be.equal(
					'Transaction was rejected with errors',
				);
				expect(res.body.code).to.be.eql(apiCodes.PROCESSING_ERROR);
				expect(res.body.errors[0].message).to.be.equal(
					`Failed to validate signature ${transaction.signature}`,
				);
				badTransactions.push(transaction);
			});
		});

		it('mutating data used to build the transaction id should fail', async () => {
			transaction = randomUtil.transaction();
			transaction.timestamp += 1;

			return sendTransactionPromise(
				transaction,
				apiCodes.PROCESSING_ERROR,
			).then(res => {
				expect(res.body.message).to.eql('Transaction was rejected with errors');
				expect(res.body.code).to.eql(apiCodes.PROCESSING_ERROR);
				expect(res.body.errors).to.not.be.empty;
				badTransactions.push(transaction);
			});
		});

		it('using zero amount should fail', async () => {
			// TODO: Remove signRawTransaction on lisk-transactions 3.0.0
			transaction = transactionUtils.signRawTransaction({
				transaction: {
					type: 0,
					amount: '0',
					recipientId: account.address,
					fee: new BigNum(10000000).toString(),
					asset: {},
				},
				passphrase: accountFixtures.genesis.passphrase,
			});

			return sendTransactionPromise(
				transaction,
				apiCodes.PROCESSING_ERROR,
			).then(res => {
				expect(res.body.message).to.be.equal(
					'Transaction was rejected with errors',
				);
				expect(res.body.code).to.be.eql(apiCodes.PROCESSING_ERROR);
				expect(res.body.errors[0].message).to.be.equal(
					'Amount must be a valid number in string format.',
				);
				badTransactions.push(transaction);
			});
		});

		it('when sender has no funds should fail', async () => {
			transaction = transfer({
				amount: '1',
				passphrase: account.passphrase,
				recipientId: '1L',
			});

			return sendTransactionPromise(
				transaction,
				apiCodes.PROCESSING_ERROR,
			).then(res => {
				expect(res.body.message).to.be.equal(
					'Transaction was rejected with errors',
				);
				expect(res.body.code).to.be.eql(apiCodes.PROCESSING_ERROR);
				expect(res.body.errors[0].message).to.be.equal(
					`Account does not have enough LSK: ${account.address}, balance: 0`,
				);
				badTransactions.push(transaction);
			});
		});

		it('using entire balance should fail', async () => {
			transaction = transfer({
				amount: accountFixtures.genesis.balance,
				passphrase: accountFixtures.genesis.passphrase,
				recipientId: account.address,
			});

			return sendTransactionPromise(
				transaction,
				apiCodes.PROCESSING_ERROR,
			).then(res => {
				expect(res.body.message).to.be.equal(
					'Transaction was rejected with errors',
				);
				expect(res.body.code).to.be.eql(apiCodes.PROCESSING_ERROR);
				expect(res.body.errors[0].message).to.include(
					'Account does not have enough LSK: 12451387766827060593L, balance: ',
				);
				badTransactions.push(transaction);
			});
		});

		it('from the genesis account should fail', async () => {
			const signedTransactionFromGenesis = {
				id: '5970172519673722038',
				amount: '1000',
				type: 0,
				timestamp: 24259352,
				senderPublicKey:
					'49e51624ec10f6a93910c368dc06edc5d00a5d23eaddccae80a2d5194708317b',
				senderId: '17569527945385187032L',
				recipientId: '4103804705971278554L',
				fee: '10000000',
				signature:
					'700123f49ca830e31aeaa945eea8938c1fe8d259bb1835eedc04219b4aebdf4a92550041f3227984f57c73d0c82898d7d94935887b48ffd1f90e94f004e9880f',
				signatures: [],
				asset: {},
			};

			return sendTransactionPromise(
				signedTransactionFromGenesis,
				apiCodes.PROCESSING_ERROR,
			).then(res => {
				expect(res.body.message).to.be.equal(
					'Transaction was rejected with errors',
				);
				expect(res.body.code).to.be.eql(apiCodes.PROCESSING_ERROR);
				expect(res.body.errors[0].message).to.include(
					'Account does not have enough LSK: 17569527945385187032L, balance: -',
				);
				badTransactions.push(signedTransactionFromGenesis);
			});
		});

		it('when sender has funds should be ok', async () => {
			return sendTransactionPromise(goodTransaction).then(res => {
				expect(res.body.data.message).to.be.equal('Transaction(s) accepted');
				goodTransactions.push(goodTransaction);
			});
		});

		it('sending transaction with same id twice should fail', async () => {
			return sendTransactionPromise(
				goodTransaction,
				apiCodes.PROCESSING_ERROR,
			).then(res => {
				expect(res.body.message).to.be.equal(
					'Transaction was rejected with errors',
				);
				expect(res.body.code).to.be.eql(apiCodes.PROCESSING_ERROR);
				expect(res.body.errors[0].message).to.be.equal(
					`Transaction is already processed: ${goodTransaction.id}`,
				);
			});
		});

		it('sending transaction with same id twice but newer timestamp should fail', async () => {
			cloneGoodTransaction.timestamp += 1;

			return sendTransactionPromise(
				cloneGoodTransaction,
				apiCodes.PROCESSING_ERROR,
			).then(res => {
				expect(res.body.message).to.be.equal(
					'Transaction was rejected with errors',
				);
				expect(res.body.code).to.be.eql(apiCodes.PROCESSING_ERROR);
				expect(res.body.errors[1].message).to.be.equal(
					'Invalid transaction id',
				);
			});
		});

		it('sending transaction with same id twice but older timestamp should fail', async () => {
			cloneGoodTransaction.timestamp -= 1;

			return sendTransactionPromise(
				cloneGoodTransaction,
				apiCodes.PROCESSING_ERROR,
			).then(res => {
				expect(res.body.message).to.be.equal(
					'Transaction was rejected with errors',
				);
				expect(res.body.code).to.be.eql(apiCodes.PROCESSING_ERROR);
				expect(res.body.errors[0].message).to.be.equal(
					`Transaction is already processed: ${cloneGoodTransaction.id}`,
				);
			});
		});

		describe('with offset', () => {
			it('using -10000 should be ok', async () => {
				transaction = transfer({
					amount: '1',
					passphrase: accountFixtures.genesis.passphrase,
					recipientId: accountOffset.address,
					timeOffset: -10000,
				});

				return sendTransactionPromise(transaction).then(res => {
					expect(res.body.data.message).to.be.equal('Transaction(s) accepted');
					goodTransactions.push(transaction);
				});
			});

			it('using future timestamp should fail', async () => {
				transaction = transfer({
					amount: '1',
					passphrase: accountFixtures.genesis.passphrase,
					recipientId: accountOffset.address,
					timeOffset: 10000,
				});

				return sendTransactionPromise(
					transaction,
					apiCodes.PROCESSING_ERROR,
				).then(res => {
					expect(res.body.message).to.be.equal(
						'Transaction was rejected with errors',
					);
					expect(res.body.code).to.be.eql(apiCodes.PROCESSING_ERROR);
					expect(res.body.errors[0].message).to.be.equal(
						'Invalid transaction timestamp. Timestamp is in the future',
					);
				});
			});
		});

		describe('with additional data field', () => {
			describe('invalid cases', () => {
				const invalidCases = typesRepresentatives.additionalDataInvalidCases.concat(
					typesRepresentatives.nonStrings,
				);

				invalidCases.forEach(test => {
					it(`using ${test.description} should fail`, async () => {
						const accountAdditionalData = randomUtil.account();
						transaction = transfer({
							amount: '1',
							passphrase: accountFixtures.genesis.passphrase,
							recipientId: accountAdditionalData.address,
						});
						transaction.asset.data = test.input;
						return sendTransactionPromise(
							transaction,
							apiCodes.PROCESSING_ERROR,
						).then(res => {
							expect(res.body.message).to.be.equal(
								'Transaction was rejected with errors',
							);
							expect(res.body.code).to.be.eql(apiCodes.PROCESSING_ERROR);
							expect(res.body.errors[0].message).to.not.be.empty;
							badTransactions.push(transaction);
						});
					});
				});
			});

			describe('valid cases', () => {
				const validCases = typesRepresentatives.additionalDataValidCases.concat(
					typesRepresentatives.strings,
				);

				validCases.forEach(test => {
					it(`using ${test.description} should be ok`, async () => {
						const accountAdditionalData = randomUtil.account();
						transaction = transfer({
							amount: '1',
							passphrase: accountFixtures.genesis.passphrase,
							recipientId: accountAdditionalData.address,
							data: test.input,
						});

						return sendTransactionPromise(transaction).then(res => {
							expect(res.body.data.message).to.be.equal(
								'Transaction(s) accepted',
							);
							goodTransactions.push(transaction);
						});
					});
				});

				it('using SQL characters escaped as single quote should be ok', async () => {
					const additioinalData = "'0'";
					const accountAdditionalData = randomUtil.account();
					transaction = transfer({
						amount: '1',
						passphrase: accountFixtures.genesis.passphrase,
						recipientId: accountAdditionalData.address,
						data: additioinalData,
					});

					return sendTransactionPromise(transaction).then(res => {
						expect(res.body.data.message).to.be.equal(
							'Transaction(s) accepted',
						);
						goodTransactions.push(transaction);
					});
				});
			});

			describe('edge cases', () => {
				it('using specialChar should be ok', () => {
					const additioinalData = `${specialChar} hey \x01 :)`;
					const accountAdditionalData = randomUtil.account();
					transaction = transfer({
						amount: '1',
						passphrase: accountFixtures.genesis.passphrase,
						recipientId: accountAdditionalData.address,
						data: additioinalData,
					});

					return sendTransactionPromise(transaction).then(res => {
						expect(res.body.data.message).to.be.equal(
							'Transaction(s) accepted',
						);
						goodTransactions.push(transaction);
					});
				});

				it('using nullChar1 should fail', () => {
					const additioinalData = `${nullChar1} hey :)`;
					const accountAdditionalData = randomUtil.account();
					transaction = transfer({
						amount: '1',
						passphrase: accountFixtures.genesis.passphrase,
						recipientId: accountAdditionalData.address,
						data: additioinalData,
					});

					return sendTransactionPromise(
						transaction,
						apiCodes.PROCESSING_ERROR,
					).then(res => {
						expect(res.body.message).to.be.eql(
							'Transaction was rejected with errors',
						);
						expect(res.body.code).to.be.eql(apiCodes.PROCESSING_ERROR);
						expect(res.body.errors[0].message).to.be.equal(
							'\'.data\' should match format "transferData"',
						);
						badTransactions.push(transaction);
					});
				});

				it('using nullChar2 should fail', () => {
					const additionalData = `${nullChar2} hey :)`;
					const accountAdditionalData = randomUtil.account();
					transaction = transfer({
						amount: '1',
						passphrase: accountFixtures.genesis.passphrase,
						recipientId: accountAdditionalData.address,
						data: additionalData,
					});

					return sendTransactionPromise(
						transaction,
						apiCodes.PROCESSING_ERROR,
					).then(res => {
						expect(res.body.message).to.be.eql(
							'Transaction was rejected with errors',
						);
						expect(res.body.code).to.be.eql(apiCodes.PROCESSING_ERROR);
						expect(res.body.errors[0].message).to.be.equal(
							'\'.data\' should match format "transferData"',
						);
						badTransactions.push(transaction);
					});
				});

				it('using nullChar3 should fail', () => {
					const additioinalData = `${nullChar3} hey :)`;
					const accountAdditionalData = randomUtil.account();
					transaction = transfer({
						amount: '1',
						passphrase: accountFixtures.genesis.passphrase,
						recipientId: accountAdditionalData.address,
						data: additioinalData,
					});

					return sendTransactionPromise(
						transaction,
						apiCodes.PROCESSING_ERROR,
					).then(res => {
						expect(res.body.message).to.be.eql(
							'Transaction was rejected with errors',
						);
						expect(res.body.code).to.be.eql(apiCodes.PROCESSING_ERROR);
						expect(res.body.errors[0].message).to.be.equal(
							'\'.data\' should match format "transferData"',
						);
						badTransactions.push(transaction);
					});
				});

				it('using nullChar4 should fail', () => {
					const additioinalData = `${nullChar4} hey :)`;
					const accountAdditionalData = randomUtil.account();
					transaction = transfer({
						amount: '1',
						passphrase: accountFixtures.genesis.passphrase,
						recipientId: accountAdditionalData.address,
						data: additioinalData,
					});

					return sendTransactionPromise(
						transaction,
						apiCodes.PROCESSING_ERROR,
					).then(res => {
						expect(res.body.message).to.be.eql(
							'Transaction was rejected with errors',
						);
						expect(res.body.code).to.be.eql(apiCodes.PROCESSING_ERROR);
						expect(res.body.errors[0].message).to.be.equal(
							'\'.data\' should match format "transferData"',
						);
						badTransactions.push(transaction);
					});
				});
			});
		});
	});

	describe('confirmation', () => {
		phases.confirmation(goodTransactions, badTransactions);
	});

	describe('validation', () => {
		it('sending already confirmed transaction should fail', async () => {
			return sendTransactionPromise(
				goodTransaction,
				apiCodes.PROCESSING_ERROR,
			).then(res => {
				expect(res.body.message).to.be.eql(
					'Transaction was rejected with errors',
				);
				expect(res.body.code).to.be.eql(apiCodes.PROCESSING_ERROR);
				expect(res.body.errors[0].message).to.be.equal(
					`Transaction is already confirmed: ${goodTransaction.id}`,
				);
			});
		});
	});
});
