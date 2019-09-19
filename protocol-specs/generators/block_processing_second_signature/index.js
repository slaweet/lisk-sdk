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
		address: '11036225455433466506L',
		publicKey:
			'd13a2659f908146f099da29216a18fd7f845b4e1455087b1a4bced79b6fefadf',
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
		address: '7917418729031818208L',
		publicKey:
			'6fdfafcd8206c179d351baac5dc104a5ff46453e9d7f27f3e28ef38fc93d7799',
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
		address: '11036225455433466506L',
		publicKey:
			'd13a2659f908146f099da29216a18fd7f845b4e1455087b1a4bced79b6fefadf',
		passphrase:
			'amazing rose void lion bamboo maid electric involve feed way popular actor',
		balance: '10000000000000000',
		encryptedPassphrase:
			'iterations=1&cipherText=efd726ad67973f374caeda0f715571974789b99e70aa961129f295aa8e4c8d0bb39e321402fbcc126e8bf8630e17c13c4743702cd10343777ba17e443b7d444a76560538030e459afb3e&iv=8654394f37d831abdc5181be&salt=bbeee4479ae011704151acb23f0a889d&tag=44a42e50eb8bdc183fe68161856055b1&version=1',
		password: 'elephant tree paris dragon chair galaxy',
	},
	existingDelegate: {
		address: '7917418729031818208L',
		publicKey:
			'6fdfafcd8206c179d351baac5dc104a5ff46453e9d7f27f3e28ef38fc93d7799',
		passphrase:
			'honey lady pepper arch cluster uncover empty toss usual correct boil clay',
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
