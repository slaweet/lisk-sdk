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
	account: {
		address: '7917418729031818208L',
		publicKey:
			'6fdfafcd8206c179d351baac5dc104a5ff46453e9d7f27f3e28ef38fc93d7799',
		passphrase:
			'honey lady pepper arch cluster uncover empty toss usual correct boil clay',
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
		.from('11036225455433466506L')
		.to('7917418729031818208L')
		.forge();

	chainStateBuilder
		.transfer('40')
		.from('7917418729031818208L')
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
		.from('11036225455433466506L')
		.to('7917418729031818208L')
		.forge();

	chainStateBuilder
		.transfer('40')
		.from('7917418729031818208L')
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
		.from('11036225455433466506L')
		.to('7917418729031818208L')
		.forge();

	chainStateBuilder
		.transfer('1')
		.from('7917418729031818208L')
		.to('2222471382442610527L')
		.forge();

	// After the first transfer of 0.5 lsk (0.5 + 0.1 fee) the second transfer leaves the account with insufficient funds (0.4)
	chainStateBuilder
		.transfer('0.5')
		.from('2222471382442610527L')
		.to('7917418729031818208L')
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
