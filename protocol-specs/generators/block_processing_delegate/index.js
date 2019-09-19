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
	existingDelegate: {
		address: '7917418729031818208L',
		publicKey:
			'6fdfafcd8206c179d351baac5dc104a5ff46453e9d7f27f3e28ef38fc93d7799',
		passphrase:
			'honey lady pepper arch cluster uncover empty toss usual correct boil clay',
		balance: '0',
		delegateName: 'genesis_100',
	},
	futureDelegate: {
		passphrase:
			'blame address tube insect cost knock major level regret bring april stick',
		privateKey:
			'b92e223981770c716ee54192a0ad028639d28d41221b72e455447bc4767aeb94caff2242b740a733daa3f3f96fc1592303b60c1704a8ac626e2704da039f41ee',
		publicKey:
			'caff2242b740a733daa3f3f96fc1592303b60c1704a8ac626e2704da039f41ee',
		address: '2222471382442610527L',
		balance: '0',
	},
};

const generateTestCasesValidBlockDelegateRegistration = () => {
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
		.transfer('30')
		.from('7917418729031818208L')
		.to('2222471382442610527L')
		.forge();

	chainStateBuilder
		.registerDelegate('RadioHead')
		.for('2222471382442610527L')
		.forge();

	const chainAndAccountStates = chainStateBuilder.getScenario();

	return {
		initialState: {
			chain: chainAndAccountStates.chain.slice(0, 2),
			accounts: chainAndAccountStates.initialAccountsState,
		},
		input: chainAndAccountStates.chain.slice(2),
		output: {
			chain: chainAndAccountStates.chain,
			accounts: chainAndAccountStates.finalAccountsState.slice(-1),
		},
	};
};

const generateTestCasesInvalidBlockDelegateRegistrationSecondTime = () => {
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
		.transfer('30')
		.from('7917418729031818208L')
		.to('2222471382442610527L')
		.forge();

	chainStateBuilder
		.registerDelegate('RadioHead')
		.for('2222471382442610527L')
		.forge();

	chainStateBuilder
		.registerDelegate('RadioHead')
		.for('2222471382442610527L')
		.forgeInvalidInputBlock();

	const chainAndAccountStates = chainStateBuilder.getScenario();

	return {
		initialState: {
			chain: chainAndAccountStates.chain.slice(0, 3),
			accounts: chainAndAccountStates.initialAccountsState,
		},
		input: chainAndAccountStates.inputBlock,
		output: {
			chain: chainAndAccountStates.chain,
			accounts: chainAndAccountStates.finalAccountsState.slice(-1),
		},
	};
};

const generateTestCasesInvalidBlockDelegateRegistrationForbiddenName = () => {
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
		.transfer('30')
		.from('7917418729031818208L')
		.to('2222471382442610527L')
		.forge();

	chainStateBuilder
		.registerDelegate('2222471382442610527L')
		.for('2222471382442610527L')
		.forgeInvalidInputBlock();

	const chainAndAccountStates = chainStateBuilder.getScenario();

	return {
		initialState: {
			chain: chainAndAccountStates.chain.slice(0, 2),
			accounts: chainAndAccountStates.initialAccountsState,
		},
		input: chainAndAccountStates.inputBlock,
		output: {
			chain: chainAndAccountStates.chain,
			accounts: chainAndAccountStates.finalAccountsState.slice(-1),
		},
	};
};

const validBlockWithDelegateRegistrationSuite = () => ({
	title: 'Valid block processing',
	summary: 'A valid block with a delegate registration',
	config: 'mainnet',
	runner: 'block_processing_delegate',
	handler: 'valid_block_processing_delegate_registration_tx',
	testCases: generateTestCasesValidBlockDelegateRegistration(),
});

const invalidBlockWithSecondDelegateRegistrationSuite = () => ({
	title: 'Invalid block processing',
	summary: 'An invalid block with a second delegate registration',
	config: 'mainnet',
	runner: 'block_processing_delegate',
	handler: 'invalid_block_processing_second_delegate_registration_tx',
	testCases: generateTestCasesInvalidBlockDelegateRegistrationSecondTime(),
});

const invalidBlockWithForbiddenNameDelegateRegistrationSuite = () => ({
	title: 'Invalid block processing',
	summary: 'An invalid block with a delegate registration using invalid name',
	config: 'mainnet',
	runner: 'block_processing_delegate',
	handler: 'invalid_block_processing_forbidden_name_delegate_registration_tx',
	testCases: generateTestCasesInvalidBlockDelegateRegistrationForbiddenName(),
});

module.exports = BaseGenerator.runGenerator('block_processing_delegate', [
	validBlockWithDelegateRegistrationSuite,
	invalidBlockWithSecondDelegateRegistrationSuite,
	invalidBlockWithForbiddenNameDelegateRegistrationSuite,
]);
