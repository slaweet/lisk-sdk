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

const BaseGenerator = require('../base_generator');
const defaultConfig = require('../../config/devnet');
const ChainStateBuilder = require('../../utils/chain_state_builder');

const { genesisBlock } = defaultConfig;

// Computed within Client application
// TODO: Compute the initial account state here
const initialAccountsState = [
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
	account: {
		address: '4103804705971278554L',
		publicKey:
			'f834a69d7f017b649859ea85f0a0c649202a8fb4619afa96daed06fa5641746b',
		passphrase:
			'predict magic rebuild much rapid barely tuna push senior install soup village',
		balance: '0',
		delegateName: 'genesis_100',
	},
	secondAccount: {
		passphrase:
			'blame address tube insect cost knock major level regret bring april stick',
		privateKey:
			'b92e223981770c716ee54192a0ad028639d28d41221b72e455447bc4767aeb94caff2242b740a733daa3f3f96fc1592303b60c1704a8ac626e2704da039f41ee',
		publicKey:
			'caff2242b740a733daa3f3f96fc1592303b60c1704a8ac626e2704da039f41ee',
		address: '2222471382442610527L',
		balance: '0',
	},
	thirdAccount: {
		passphrase:
			'female favorite client offer winner loud ostrich rich slogan jacket owner february',
		privateKey:
			'9b10f230fb2109cc77ee1a1ad659bf51f0e7b3c16697da416004dd409b427578ae88a228d37de7438f3d74df1713f3da00dd1c51afdc97bd47fa3aceb111a47a',
		publicKey:
			'ae88a228d37de7438f3d74df1713f3da00dd1c51afdc97bd47fa3aceb111a47a',
		address: '11325618463998518034L',
	},
};

const generateTestCasesValidBlockTransferTx = () => {
	const chainStateBuilder = new ChainStateBuilder(
		genesisBlock,
		initialAccountsState,
		accounts,
	);

	chainStateBuilder
		.transfer('50')
		.from('12451387766827060593L')
		.to('4103804705971278554L')
		.forge();

	chainStateBuilder
		.transfer('40')
		.from('4103804705971278554L')
		.to('2222471382442610527L')
		.forge();

	const chainAndAccountStates = chainStateBuilder.getScenario();

	return {
		initialState: {
			// Given the library chainStateBuilder saves all mutations we use slice here to pick the first accounts state
			chain: chainAndAccountStates.chain.slice(0, 1),
			accounts: chainAndAccountStates.initialAccountsState,
		},
		input: chainAndAccountStates.chain.slice(1),
		output: {
			chain: chainAndAccountStates.chain,
			// Given the library chainStateBuilder saves all mutations we use slice here to pick the last account state
			accounts: chainAndAccountStates.finalAccountsState.slice(-1),
		},
	};
};

const generateTestCasesValidTransfersInvalidInSame = () => {
	const chainStateBuilder = new ChainStateBuilder(
		genesisBlock,
		initialAccountsState,
		accounts,
	);

	chainStateBuilder
		.transfer('50')
		.from('12451387766827060593L')
		.to('4103804705971278554L')
		.forge();

	chainStateBuilder
		.transfer('40')
		.from('4103804705971278554L')
		.to('2222471382442610527L')
		.transfer('20')
		.from('2222471382442610527L')
		.to('11325618463998518034L')
		.forgeInvalidInputBlock();

	const chainAndAccountStates = chainStateBuilder.getScenario();

	return {
		initialState: {
			chain: chainAndAccountStates.chain.slice(0, 1),
			accounts: chainAndAccountStates.initialAccountsState,
		},
		input: chainAndAccountStates.inputBlock,
		output: {
			chain: chainAndAccountStates.chain,
			accounts: chainAndAccountStates.finalAccountsState.slice(-1),
		},
	};
};

const generateTestCasesTransferTooMuchSpentInBlockContext = () => {
	const chainStateBuilder = new ChainStateBuilder(
		genesisBlock,
		initialAccountsState,
		accounts,
	);

	chainStateBuilder
		.transfer('50')
		.from('12451387766827060593L')
		.to('4103804705971278554L')
		.forge();

	chainStateBuilder
		.transfer('1')
		.from('4103804705971278554L')
		.to('2222471382442610527L')
		.forge();

	// After the first transfer of 0.5 lsk (0.5 + 0.1 fee) the second transfer leaves the account with insufficient funds (0.4)
	chainStateBuilder
		.transfer('0.5')
		.from('2222471382442610527L')
		.to('4103804705971278554L')
		.transfer('0.5')
		.from('2222471382442610527L')
		.to('11325618463998518034L')
		.forgeInvalidInputBlock();

	const chainAndAccountStates = chainStateBuilder.getScenario();

	return {
		initialState: {
			chain: chainAndAccountStates.chain.slice(0, 1),
			accounts: chainAndAccountStates.initialAccountsState,
		},
		input: chainAndAccountStates.inputBlock,
		output: {
			chain: chainAndAccountStates.chain,
			accounts: chainAndAccountStates.finalAccountsState.slice(-1),
		},
	};
};

const validBlockWithTransferTxSuite = () => ({
	title: 'Valid block processing',
	summary: 'A valid block with a transfer transaction is processed',
	config: 'mainnet',
	runner: 'block_processing_transfers',
	handler: 'valid_block_processing_one_transfer_tx',
	testCases: generateTestCasesValidBlockTransferTx(),
});

const invalidBlockFundingAndTransferSameBlock = () => ({
	title: 'Invalid block processing',
	summary:
		'An invalid block with transfers valid on their own but invalid in the context of same block',
	config: 'mainnet',
	runner: 'block_processing_transfers',
	handler: 'invalid_block_processing_funding_and_transfer_same_block',
	testCases: generateTestCasesValidTransfersInvalidInSame(),
});

const invalidBlockTooMuchSpent = () => ({
	title: 'Invalid block processing',
	summary:
		'An invalid block with transfers valid on their own but second transfer would not have enough funds after fee is applied',
	config: 'mainnet',
	runner: 'block_processing_transfers',
	handler: 'invalid_block_processing_not_enough_balance_for_second_transaction',
	testCases: generateTestCasesTransferTooMuchSpentInBlockContext(),
});

module.exports = BaseGenerator.runGenerator('block_processing_transfers', [
	validBlockWithTransferTxSuite,
	invalidBlockFundingAndTransferSameBlock,
	invalidBlockTooMuchSpent,
]);
