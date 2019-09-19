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
		voteWeight: '1000000000000',
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
	futureMultisignatureAccount: {
		passphrase:
			'blame address tube insect cost knock major level regret bring april stick',
		privateKey:
			'b92e223981770c716ee54192a0ad028639d28d41221b72e455447bc4767aeb94caff2242b740a733daa3f3f96fc1592303b60c1704a8ac626e2704da039f41ee',
		publicKey:
			'caff2242b740a733daa3f3f96fc1592303b60c1704a8ac626e2704da039f41ee',
		address: '2222471382442610527L',
		balance: '0',
	},

	memberA: {
		passphrase:
			'measure salon trigger series blood mother door wolf agent plate absent lens',
		privateKey:
			'f25255abdd72b6033b860e71bd95696e2da6f7f5f080db9b330303c9b57b9623bed1c99f4a99cd584e886c80b300ef18e9d4265b5158e805bfdb609a77bd163f',
		publicKey:
			'bed1c99f4a99cd584e886c80b300ef18e9d4265b5158e805bfdb609a77bd163f',
		address: '8465920867403822059L',
	},
	memberB: {
		passphrase:
			'spoil taxi price maple steel detect welcome oyster glove alley caution year',
		privateKey:
			'328a236de4b2e877e6ae3e840a6c5513c2c68b62d13d6fcff50f056e60dfdeeaa3642d1c4605499182e5081f864b5a6f1584df336d2f2c3e49b197cbd1f36d78',
		publicKey:
			'a3642d1c4605499182e5081f864b5a6f1584df336d2f2c3e49b197cbd1f36d78',
		address: '1670991471799963578L',
	},
};

const generateTestCasesValidBlockMultisignatureRegistrationTx = () => {
	const chainStateBuilder = new ChainStateBuilder(
		genesisBlock,
		initialAccountsState,
		accounts,
	);

	// Transfer funds from genesis account to one of the delegates
	chainStateBuilder
		.transfer('100')
		.from('2580432900309532760L')
		.to('4779466276403361478L')
		.forge();
	// Fund three accounts
	chainStateBuilder
		.transfer('30')
		.from('4779466276403361478L')
		.to('2222471382442610527L')
		.forge();

	// Register multisignature and two co-signers for it
	chainStateBuilder
		.registerMultisignature('2222471382442610527L')
		.addMemberAndSign('8465920867403822059L')
		.addMemberAndSign('1670991471799963578L')
		.finish()
		.forge();

	const chainAndAccountStates = chainStateBuilder.getScenario();

	return {
		initialState: {
			// Given the library chainStateBuilder saves all mutations we use slice here to pick the first accounts state
			chain: chainAndAccountStates.chain.slice(0, 2),
			accounts: chainAndAccountStates.finalAccountsState[4],
		},
		input: chainAndAccountStates.chain.slice(2),
		output: {
			chain: chainAndAccountStates.chain,
			// Given the library chainStateBuilder saves all mutations we use slice here to pick the last account state
			accounts: chainAndAccountStates.finalAccountsState.slice(-1),
		},
	};
};

const generateTestCasesValidBlockTransferFromMultisignatureAccount = () => {
	const chainStateBuilder = new ChainStateBuilder(
		genesisBlock,
		initialAccountsState,
		accounts,
	);

	// Transfer funds from genesis account to one of the delegates
	chainStateBuilder
		.transfer('100')
		.from('2580432900309532760L')
		.to('4779466276403361478L')
		.forge();
	// Fund three accounts
	chainStateBuilder
		.transfer('30')
		.from('4779466276403361478L')
		.to('2222471382442610527L')
		.forge();

	// Register multisignature and two co-signers for it
	chainStateBuilder
		.registerMultisignature('2222471382442610527L')
		.addMemberAndSign('8465920867403822059L')
		.addMemberAndSign('1670991471799963578L')
		.finish()
		.forge();
	// Tranfer from the new multisignature account
	chainStateBuilder
		.transfer('7')
		.from('2222471382442610527L')
		.to('4779466276403361478L');

	chainStateBuilder
		.signTransaction(chainStateBuilder.lastTransactionId)
		.withAccount('8465920867403822059L');

	chainStateBuilder
		.signTransaction(chainStateBuilder.lastTransactionId)
		.withAccount('1670991471799963578L')
		.forge();

	const chainAndAccountStates = chainStateBuilder.getScenario();

	return {
		initialState: {
			// Given the library chainStateBuilder saves all mutations we use slice here to pick the first accounts state
			chain: chainAndAccountStates.chain.slice(0, 3),
			accounts: chainAndAccountStates.finalAccountsState[4],
		},
		input: chainAndAccountStates.chain.slice(3),
		output: {
			chain: chainAndAccountStates.chain,
			// Given the library chainStateBuilder saves all mutations we use slice here to pick the last account state
			accounts: chainAndAccountStates.finalAccountsState.slice(-1),
		},
	};
};

const generateTestCasesInvalidBlockMultisignatureRegistrationAndFundingInSameBlock = () => {
	const chainStateBuilder = new ChainStateBuilder(
		genesisBlock,
		initialAccountsState,
		accounts,
	);

	// Transfer funds from genesis account to one of the delegates
	chainStateBuilder
		.transfer('100')
		.from('2580432900309532760L')
		.to('4779466276403361478L')
		.forge();
	// Fund three accounts
	chainStateBuilder
		.transfer('30')
		.from('4779466276403361478L')
		.to('2222471382442610527L');

	// Register multisignature and two co-signers for it
	chainStateBuilder
		.registerMultisignature('2222471382442610527L')
		.addMemberAndSign('8465920867403822059L')
		.addMemberAndSign('1670991471799963578L')
		.finish()
		.forgeInvalidInputBlock();

	const chainAndAccountStates = chainStateBuilder.getScenario();

	return {
		initialState: {
			// Given the library chainStateBuilder saves all mutations we use slice here to pick the first accounts state
			chain: chainAndAccountStates.chain.slice(0),
			accounts: chainAndAccountStates.initialAccountsState,
		},
		input: chainAndAccountStates.inputBlock,
		output: {
			chain: chainAndAccountStates.chain,
			// Given the library chainStateBuilder saves all mutations we use slice here to pick the last account state
			accounts: chainAndAccountStates.finalAccountsState.slice(-1),
		},
	};
};

const generateTestCasesInvalidBlockTransferFromMultisignatureAccountOnSameBlockAsRegistration = () => {
	const chainStateBuilder = new ChainStateBuilder(
		genesisBlock,
		initialAccountsState,
		accounts,
	);

	// Transfer funds from genesis account to one of the delegates
	chainStateBuilder
		.transfer('100')
		.from('2580432900309532760L')
		.to('4779466276403361478L')
		.forge();
	// Fund three accounts
	chainStateBuilder
		.transfer('30')
		.from('4779466276403361478L')
		.to('2222471382442610527L')
		.forge();

	// Register multisignature and two co-signers for it
	chainStateBuilder
		.registerMultisignature('2222471382442610527L')
		.addMemberAndSign('8465920867403822059L')
		.addMemberAndSign('1670991471799963578L')
		.finish();
	// Tranfer from the new multisignature account
	chainStateBuilder
		.transfer('7')
		.from('2222471382442610527L')
		.to('4779466276403361478L');

	chainStateBuilder
		.signTransaction(chainStateBuilder.lastTransactionId)
		.withAccount('8465920867403822059L');

	chainStateBuilder
		.signTransaction(chainStateBuilder.lastTransactionId)
		.withAccount('1670991471799963578L')
		.forgeInvalidInputBlock();

	const chainAndAccountStates = chainStateBuilder.getScenario();

	return {
		initialState: {
			// Given the library chainStateBuilder saves all mutations we use slice here to pick the first accounts state
			chain: chainAndAccountStates.chain.slice(0, 2),
			accounts: chainAndAccountStates.finalAccountsState[4],
		},
		input: chainAndAccountStates.inputBlock,
		output: {
			chain: chainAndAccountStates.chain,
			// Given the library chainStateBuilder saves all mutations we use slice here to pick the last account state
			accounts: chainAndAccountStates.finalAccountsState.slice(-1),
		},
	};
};

const validBlockWithMultisignatureRegistrationTx = () => ({
	title: 'Valid block processing',
	summary:
		'A valid block with a multisignature registration transaction processed',
	config: 'mainnet',
	runner: 'block_processing_multisignatures',
	handler: 'valid_block_processing_multisignature_registration_tx',
	testCases: generateTestCasesValidBlockMultisignatureRegistrationTx(),
});

const validBlockWithTransferFromMultisigAccount = () => ({
	title: 'Valid block processing',
	summary:
		'A valid block with a transfer transaction from a multisignature account processed',
	config: 'mainnet',
	runner: 'block_processing_multisignatures',
	handler: 'valid_block_processing_transfer_from_multisignature_account',
	testCases: generateTestCasesValidBlockTransferFromMultisignatureAccount(),
});

const invalidBlockWithMultisignatureRegistrationAndFundingInSameBlock = () => ({
	title: 'Invalid block processing',
	summary:
		'An invalid block with a multisignature registration transaction and funding for members in same block',
	config: 'mainnet',
	runner: 'block_processing_multisignatures',
	handler:
		'invalid_block_processing_multisignature_registration_and_funding_for_members_same_block',
	testCases: generateTestCasesInvalidBlockMultisignatureRegistrationAndFundingInSameBlock(),
});

const invalidBlockWithTransferFromMultisigAccountOnSameBlockAsRegistration = () => ({
	title: 'Invalid block processing',
	summary:
		'An invalid block with a multisignature registration and transfer from that account on same block',
	config: 'mainnet',
	runner: 'block_processing_multisignatures',
	handler:
		'invalid_block_processing_transfer_from_multisignature_account_on_same_block_as_registration',
	testCases: generateTestCasesInvalidBlockTransferFromMultisignatureAccountOnSameBlockAsRegistration(),
});

module.exports = BaseGenerator.runGenerator('block_processing_transfers', [
	validBlockWithMultisignatureRegistrationTx,
	invalidBlockWithMultisignatureRegistrationAndFundingInSameBlock,
	validBlockWithTransferFromMultisigAccount,
	invalidBlockWithTransferFromMultisigAccountOnSameBlockAsRegistration,
]);
