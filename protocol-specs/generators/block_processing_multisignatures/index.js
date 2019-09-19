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
		.from('11036225455433466506L')
		.to('7917418729031818208L')
		.forge();
	// Fund three accounts
	chainStateBuilder
		.transfer('30')
		.from('7917418729031818208L')
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
		.from('11036225455433466506L')
		.to('7917418729031818208L')
		.forge();
	// Fund three accounts
	chainStateBuilder
		.transfer('30')
		.from('7917418729031818208L')
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
		.to('7917418729031818208L');

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
		.from('11036225455433466506L')
		.to('7917418729031818208L')
		.forge();
	// Fund three accounts
	chainStateBuilder
		.transfer('30')
		.from('7917418729031818208L')
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
		.from('11036225455433466506L')
		.to('7917418729031818208L')
		.forge();
	// Fund three accounts
	chainStateBuilder
		.transfer('30')
		.from('7917418729031818208L')
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
		.to('7917418729031818208L');

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
