/*
 * Copyright © 2018 Lisk Foundation
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

const {
	TransferTransaction,
	SecondSignatureTransaction,
} = require('@liskhq/lisk-transactions');
const { getKeys } = require('@liskhq/lisk-cryptography');
const { cloneDeep } = require('lodash');
const BigNum = require('@liskhq/bignum');
const BaseGenerator = require('../base_generator');
const defaultConfig = require('../../config/devnet');
const { createBlock } = require('../../utils/blocks');

const { genesisBlock } = defaultConfig;

const timestamp = 102702700;

// Computed within Client application
// TODO: Compute the initial account state here
// TODO: add this to chain_state_builder
const initialAccountState = [
	{
		address: '12451387766827060593L',
		publicKey:
			'0b3dc5a506e312bac462afc4fb34cdc3b19d1976a279930d15ae3c3516edd188',
		balance: '1000000000000',
		secondSignature: 0,
		isDelegate: 0,
		vote: '0',
		multimin: 0,
		multilifetime: 0,
		nameexist: 0,
		producedBlocks: 0,
		missedBlocks: 0,
		fees: '0',
		rewards: '0',
		asset: {},
		voteWeight: '0',
	},
	{
		username: 'genesis_100',
		isDelegate: 1,
		secondSignature: 0,
		address: '4103804705971278554L',
		publicKey:
			'f834a69d7f017b649859ea85f0a0c649202a8fb4619afa96daed06fa5641746b',
		balance: '0',
		vote: '0',
		multimin: 0,
		multilifetime: 0,
		nameexist: 0,
		producedBlocks: 0,
		missedBlocks: 0,
		fees: '0',
		rewards: '0',
		asset: {},
		voteWeight: '1000000000000',
	},
];

// Object holding the genesis account information and passphrase as well as
// an existing delegate account for DEVNET
// TODO: Move this to devnet.json config file.
const accounts = {
	// Genesis account, initially holding 100M total supply
	genesis: {
		address: '12451387766827060593L',
		publicKey:
			'0b3dc5a506e312bac462afc4fb34cdc3b19d1976a279930d15ae3c3516edd188',
		passphrase:
			'bargain airport little hungry lake point need antique scout phrase team adjust',
		balance: '10000000000000000',
		encryptedPassphrase:
			'iterations=10&cipherText=a579bce90228ce05e9fcb19191c266bf5ff4b49bb78f94b0b80f166b3c5913e82e5aa0cb32ebd9fa9c09383a39dc6e0ce4b4d062815bec3023e207bb8088163f2fc481767e7100dd2e6635371ea9&iv=2ca3ad9581d0ae30085cf79d&salt=f411a5dcd61cde7a821d1df833e02f65&tag=42f278de8eaf61d8b377bb84eb1694ff&version=1',
		password: 'elephant tree paris dragon chair galaxy',
	},
	existingDelegate: {
		address: '4103804705971278554L',
		publicKey:
			'f834a69d7f017b649859ea85f0a0c649202a8fb4619afa96daed06fa5641746b',
		passphrase:
			'predict magic rebuild much rapid barely tuna push senior install soup village',
		balance: '0',
		delegateName: 'genesis_100',
	},
};

const generateTestCasesValidBlockSecondSignatureTx = () => {
	const amount = '5500000000';
	const transferObject = {
		amount,
		recipientId: accounts.existingDelegate.address,
		timestamp,
	};

	const transferTx = new TransferTransaction(transferObject);
	transferTx.sign(accounts.genesis.passphrase);

	const block = createBlock(
		defaultConfig,
		initialAccountState,
		genesisBlock,
		1,
		0,
		{
			version: 1,
			transactions: [transferTx],
		},
	);

	const { balance: senderBalance } = initialAccountState.find(
		account => account.address === accounts.genesis.address,
	);

	const { balance: recipientBalance } = initialAccountState.find(
		account => account.address === accounts.existingDelegate.address,
	);

	const resultingAccountState = cloneDeep(initialAccountState);

	resultingAccountState.find(
		account => account.address === accounts.genesis.address,
	).balance = parseInt(
		new BigNum(senderBalance.toString()).sub(amount).toString(),
		10,
	);

	resultingAccountState.find(
		account => account.address === accounts.existingDelegate.address,
	).balance = parseInt(
		new BigNum(recipientBalance.toString()).plus(amount).toString(),
		10,
	);

	const secondSignature =
		'erupt sponsor rude supreme vacant delay salute allow laundry swamp curve brain';

	const { publicKey } = getKeys(secondSignature);
	const secondPassphraseObject = {
		timestamp,
		senderPublicKey: accounts.existingDelegate.publicKey,
		asset: {
			signature: {
				publicKey,
			},
		},
	};

	const secondPassphraseTx = new SecondSignatureTransaction(
		secondPassphraseObject,
	);
	secondPassphraseTx.sign(accounts.existingDelegate.passphrase);

	const blockWithSecondSignatureRegistered = createBlock(
		defaultConfig,
		resultingAccountState,
		block,
		2,
		0,
		{
			version: 1,
			transactions: [secondPassphraseTx],
		},
	);

	const secondSignatureAccountState = cloneDeep(resultingAccountState);

	secondSignatureAccountState.find(
		account => account.address === accounts.existingDelegate.address,
	).secondPublicKey =
		'62e4d09ce3fa571fb4b073fb229f5ff18b6108ca89357924db887a409f61542c';

	const targetAccount = secondSignatureAccountState.find(
		account => account.address === accounts.existingDelegate.address,
	);

	targetAccount.balance = parseInt(
		new BigNum(targetAccount.balance.toString()).sub(500000000).toString(),
		10,
	);

	return {
		initialState: {
			chain: [block],
			accounts: resultingAccountState,
		},
		input: {
			blockWithSecondSignatureRegistered,
		},
		output: {
			chain: [block, blockWithSecondSignatureRegistered],
			accounts: secondSignatureAccountState,
		},
	};
};

const generateTestCasesinvalidBlockWithSecondSignatureAndFundsTxSuite = () => {
	const amount = '5500000000';
	const transferObject = {
		amount,
		recipientId: accounts.existingDelegate.address,
		timestamp,
	};
	const transferTx = new TransferTransaction(transferObject);
	transferTx.sign(accounts.genesis.passphrase);

	const secondSignature =
		'erupt sponsor rude supreme vacant delay salute allow laundry swamp curve brain';
	const { publicKey } = getKeys(secondSignature);
	const secondPassphraseObject = {
		timestamp,
		senderPublicKey: accounts.existingDelegate.publicKey,
		asset: {
			signature: {
				publicKey,
			},
		},
	};

	const secondPassphraseTx = new SecondSignatureTransaction(
		secondPassphraseObject,
	);
	secondPassphraseTx.sign(accounts.existingDelegate.passphrase);

	const block = createBlock(
		defaultConfig,
		initialAccountState,
		genesisBlock,
		1,
		0,
		{
			version: 1,
			transactions: [transferTx, secondPassphraseTx],
		},
	);

	return {
		initialState: {
			chain: [],
			accounts: initialAccountState,
		},
		input: {
			block,
		},
		output: {
			chain: [],
			accounts: initialAccountState,
		},
	};
};

const generateTestCasesInvalidBlockSecondSignatureTxSecondTime = () => {
	const amount = '5500000000';
	const transferObject = {
		amount,
		recipientId: accounts.existingDelegate.address,
		timestamp,
	};
	const transferTx = new TransferTransaction(transferObject);
	transferTx.sign(accounts.genesis.passphrase);

	const block = createBlock(
		defaultConfig,
		initialAccountState,
		genesisBlock,
		1,
		0,
		{
			version: 1,
			transactions: [transferTx],
		},
	);

	const { balance: senderBalance } = initialAccountState.find(
		account => account.address === accounts.genesis.address,
	);

	const { balance: recipientBalance } = initialAccountState.find(
		account => account.address === accounts.existingDelegate.address,
	);

	const resultingAccountState = cloneDeep(initialAccountState);

	resultingAccountState.find(
		account => account.address === accounts.genesis.address,
	).balance = parseInt(
		new BigNum(senderBalance.toString()).sub(amount).toString(),
		10,
	);

	resultingAccountState.find(
		account => account.address === accounts.existingDelegate.address,
	).balance = parseInt(
		new BigNum(recipientBalance.toString()).plus(amount).toString(),
		10,
	);

	const secondSignature =
		'erupt sponsor rude supreme vacant delay salute allow laundry swamp curve brain';

	const { publicKey } = getKeys(secondSignature);
	const secondPassphraseObject = {
		timestamp,
		senderPublicKey: accounts.existingDelegate.publicKey,
		asset: {
			signature: {
				publicKey,
			},
		},
	};

	const secondPassphraseTx = new SecondSignatureTransaction(
		secondPassphraseObject,
	);
	secondPassphraseTx.sign(accounts.existingDelegate.passphrase);

	const blockWithSecondSignatureRegistered = createBlock(
		defaultConfig,
		resultingAccountState,
		block,
		2,
		0,
		{
			version: 1,
			transactions: [secondPassphraseTx],
		},
	);

	const secondSignatureAccountState = cloneDeep(resultingAccountState);

	secondSignatureAccountState.find(
		account => account.address === accounts.existingDelegate.address,
	).secondPublicKey =
		'62e4d09ce3fa571fb4b073fb229f5ff18b6108ca89357924db887a409f61542c';

	const targetAccount = secondSignatureAccountState.find(
		account => account.address === accounts.existingDelegate.address,
	);

	targetAccount.balance = parseInt(
		new BigNum(targetAccount.balance.toString()).sub(500000000).toString(),
		10,
	);

	const newSecondPassphraseTx = new SecondSignatureTransaction(
		secondPassphraseObject,
	);
	newSecondPassphraseTx.sign(accounts.existingDelegate.passphrase);

	const blockWithNewSecondSignatureNewRegistration = createBlock(
		defaultConfig,
		resultingAccountState,
		block,
		3,
		0,
		{
			version: 1,
			transactions: [newSecondPassphraseTx],
		},
	);

	return {
		initialState: {
			chain: [block, blockWithSecondSignatureRegistered],
			accounts: secondSignatureAccountState,
		},
		input: {
			blockWithNewSecondSignatureNewRegistration,
		},
		output: {
			chain: [block, blockWithSecondSignatureRegistered],
			accounts: secondSignatureAccountState,
		},
	};
};

const validBlockWithSecondSignatureTxSuite = () => ({
	title: 'Valid block processing',
	summary:
		'A valid block with a second signature registration transaction is processed',
	config: 'mainnet',
	runner: 'block_processing_second_signature',
	handler: 'valid_block_processing_one_second_signature_tx',
	testCases: generateTestCasesValidBlockSecondSignatureTx(),
});

const invalidBlockWithSecondSignatureAndFundsTxSuite = () => ({
	title: 'Invalid block processing',
	summary:
		'An invalid block with a second signature registration transaction and funds for the account in same block',
	config: 'mainnet',
	runner: 'block_processing_second_signature',
	handler: 'invalid_block_processing_second_signature_and_funds_tx',
	testCases: generateTestCasesinvalidBlockWithSecondSignatureAndFundsTxSuite(),
});

const invalidBlockWithNewSecondSignatureSuite = () => ({
	title: 'Invalid block processing',
	summary:
		'An invalid block with a second signature registration transaction for an already second signature account',
	config: 'mainnet',
	runner: 'block_processing_second_signature',
	handler: 'invalid_block_processing_second_signature_for_already_registered',
	testCases: generateTestCasesInvalidBlockSecondSignatureTxSecondTime(),
});

module.exports = BaseGenerator.runGenerator(
	'block_processing_second_signature',
	[
		validBlockWithSecondSignatureTxSuite,
		invalidBlockWithSecondSignatureAndFundsTxSuite,
		invalidBlockWithNewSecondSignatureSuite,
	],
);
