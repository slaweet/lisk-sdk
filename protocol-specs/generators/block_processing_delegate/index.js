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
		address: '2580432900309532760L',
		publicKey:
			'6f1195160a7f0d8a33883feafe567e79552d30f9e6d23a99676ebc04c15c95c5',
		balance: '10000000000000000',
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
		address: '4779466276403361478L',
		publicKey:
			'961cba94ea053793b965e97a208abbce8d98711bb993c03dde7901262b44272b',
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
		voteWeight: '10000000000000000',
	},
];

// Object holding the genesis account information and passphrase as well as
// an existing delegate account for DEVNET
// TODO: Move this to devnet.json config file.
const accounts = {
	// Genesis account, initially holding 100M total supply
	genesis: {
		address: '2580432900309532760L',
		publicKey:
			'6f1195160a7f0d8a33883feafe567e79552d30f9e6d23a99676ebc04c15c95c5',
		passphrase:
			'suit unhappy dad senior tell runway gloom glass creek easily amateur trim',
		balance: '10000000000000000',
		encryptedPassphrase:
			'iterations=10&cipherText=b526b08b7cc9418b69264381c01870761dfb782427e03561ae85ad857afa975a0fe336b158ddb3b78db50ade2a0059148d3643d295db69fe9afcda5f2dbeb76062103044ffeed98dae&iv=7f47271af2bdc67aa24d6a9d&salt=535b665a7c0cd4c7a8d14a897d1b151a&tag=6bd6e5bdc8fe4a324391eeb67af1f335&version=1',
		password: 'elephant tree paris dragon chair galaxy',
	},
	existingDelegate: {
		address: '4779466276403361478L',
		publicKey:
			'961cba94ea053793b965e97a208abbce8d98711bb993c03dde7901262b44272b',
		passphrase:
			'clown casino range cruel occur van absorb smoke punch mixture photo relief',
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
		.from('2580432900309532760L')
		.to('4779466276403361478L')
		.forge();

	chainStateBuilder
		.transfer('30')
		.from('4779466276403361478L')
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
		.from('2580432900309532760L')
		.to('4779466276403361478L')
		.forge();

	chainStateBuilder
		.transfer('30')
		.from('4779466276403361478L')
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
		.from('2580432900309532760L')
		.to('4779466276403361478L')
		.forge();

	chainStateBuilder
		.transfer('30')
		.from('4779466276403361478L')
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
