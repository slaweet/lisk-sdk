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

const {
	decryptPassphraseWithPassword,
	parseEncryptedPassphrase,
	getAddressFromPrivateKey,
	getPrivateAndPublicKeyFromPassphrase,
} = require('@liskhq/lisk-cryptography');

const BaseGenerator = require('../base_generator');
const defaultConfig = require('../../config/devnet');
const genesisDelegateAccounts = require('../../config/devnet_genesis_delegates');

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
	...genesisDelegateAccounts,
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
	votingAccount: {
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

// Decrypt all passwords from delegate genesis and add to accounts array
// eslint-disable-next-line no-restricted-syntax
for (const anAccount of genesisDelegateAccounts) {
	const { encryptedPassphrase } = defaultConfig.forging.delegates.find(
		aDelegate => aDelegate.publicKey === anAccount.publicKey,
	);

	const passphrase = decryptPassphraseWithPassword(
		parseEncryptedPassphrase(encryptedPassphrase),
		defaultConfig.forging.defaultPassword,
	);
	const keys = getPrivateAndPublicKeyFromPassphrase(passphrase);
	const address = getAddressFromPrivateKey(keys.privateKey);

	accounts[`${anAccount.username}_delegate`] = {
		passphrase,
		privateKey: keys.privateKey,
		publicKey: keys.publicKey,
		address,
		balance: '0',
	};
}

// Generators
const generateTestCasesValidBlockVotesTx = () => {
	const chainStateBuilder = new ChainStateBuilder(
		genesisBlock,
		initialAccountsState,
		accounts,
	);

	// Give balance from genesis account to delegates just for having account states to compare against
	// As the state builder is pretty basic so far we need to control forging only 25 transactions like this.
	let transactionCount = 0;
	// eslint-disable-next-line no-restricted-syntax
	for (const anAccount of genesisDelegateAccounts) {
		if (transactionCount === 25) {
			chainStateBuilder.forge();
			transactionCount = 0;
		}
		transactionCount += 1;

		chainStateBuilder
			.transfer('99')
			.from('2580432900309532760L')
			.to(anAccount.address);
	}
	// Fund account that will issue votes
	chainStateBuilder
		.transfer('101')
		.from('2580432900309532760L')
		.to('2222471382442610527L');

	// Forge the block so as to have all delegates in the store
	chainStateBuilder.forge();

	// Vote for the 101 delegates with one account
	chainStateBuilder
		.castVotesFrom('2222471382442610527L')
		.voteDelegates(
			genesisDelegateAccounts
				.slice(0, 33)
				.map(aDelegate => aDelegate.publicKey),
		)
		.unvoteDelegates([]);

	chainStateBuilder
		.castVotesFrom('2222471382442610527L')
		.voteDelegates(
			genesisDelegateAccounts
				.slice(33, 66)
				.map(aDelegate => aDelegate.publicKey),
		)
		.unvoteDelegates([]);

	chainStateBuilder
		.castVotesFrom('2222471382442610527L')
		.voteDelegates(
			genesisDelegateAccounts
				.slice(66, 99)
				.map(aDelegate => aDelegate.publicKey),
		)
		.unvoteDelegates([]);

	chainStateBuilder
		.castVotesFrom('2222471382442610527L')
		.voteDelegates(
			genesisDelegateAccounts
				.slice(99, 101)
				.map(aDelegate => aDelegate.publicKey),
		)
		.unvoteDelegates([]);

	chainStateBuilder.forge();

	const chainAndAccountStates = chainStateBuilder.getScenario();
	return {
		initialState: {
			// Given the library chainStateBuilder saves all mutations we use slice here to pick the first accounts state
			chain: chainAndAccountStates.chain.slice(0, 5),
			accounts: chainAndAccountStates.initialAccountsState,
		},
		input: chainAndAccountStates.chain.slice(-1),
		output: {
			chain: chainAndAccountStates.chain,
			// Given the library chainStateBuilder saves all mutations we use slice here to pick the last account state
			accounts: chainAndAccountStates.finalAccountsState.slice(-1),
		},
	};
};

const generateTestCasesInvalidBlockTooManyVotesTx = () => {
	const chainStateBuilder = new ChainStateBuilder(
		genesisBlock,
		initialAccountsState,
		accounts,
	);

	// Give balance from genesis account to delegates just for having account states to compare against
	// As the state builder is pretty basic so far we need to control forging only 25 transactions like this.
	let transactionCount = 0;
	// eslint-disable-next-line no-restricted-syntax
	for (const anAccount of genesisDelegateAccounts) {
		if (transactionCount === 25) {
			chainStateBuilder.forge();
			transactionCount = 0;
		}
		transactionCount += 1;

		chainStateBuilder
			.transfer('99')
			.from('2580432900309532760L')
			.to(anAccount.address);
	}
	// Fund account that will issue votes
	chainStateBuilder
		.transfer('101')
		.from('2580432900309532760L')
		.to('2222471382442610527L');

	// Forge the block so as to have all delegates in the store
	chainStateBuilder.forge();

	// Vote for the 101 delegates with one account
	chainStateBuilder
		.castVotesFrom('2222471382442610527L')
		.voteDelegates(
			genesisDelegateAccounts.map(aDelegate => aDelegate.publicKey),
		)
		.unvoteDelegates([]);

	chainStateBuilder.forgeInvalidInputBlock();

	const chainAndAccountStates = chainStateBuilder.getScenario();

	return {
		initialState: {
			// Given the library chainStateBuilder saves all mutations we use slice here to pick the first accounts state
			chain: chainAndAccountStates.chain,
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

const generateTestCasesInvalidBlockVoteNoDelegateTx = () => {
	const chainStateBuilder = new ChainStateBuilder(
		genesisBlock,
		initialAccountsState,
		accounts,
	);

	// Give balance from genesis account to delegates just for having account states to compare against
	// As the state builder is pretty basic so far we need to control forging only 25 transactions like this.
	let transactionCount = 0;
	// eslint-disable-next-line no-restricted-syntax
	for (const anAccount of genesisDelegateAccounts) {
		if (transactionCount === 25) {
			chainStateBuilder.forge();
			transactionCount = 0;
		}
		transactionCount += 1;

		chainStateBuilder
			.transfer('99')
			.from('2580432900309532760L')
			.to(anAccount.address);
	}
	// Fund account that will issue votes
	chainStateBuilder
		.transfer('101')
		.from('2580432900309532760L')
		.to('2222471382442610527L');

	// Forge the block so as to have all delegates in the store
	chainStateBuilder.forge();

	const notAdelegate = ChainStateBuilder.createAccount();
	// Vote for an account is not a delegate
	chainStateBuilder
		.castVotesFrom('2222471382442610527L')
		.voteDelegates([notAdelegate.publicKey])
		.unvoteDelegates([]);

	chainStateBuilder.forgeInvalidInputBlock();

	const chainAndAccountStates = chainStateBuilder.getScenario();

	return {
		initialState: {
			// Given the library chainStateBuilder saves all mutations we use slice here to pick the first accounts state
			chain: chainAndAccountStates.chain,
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

const generateTestCasesInvalidBlockVoteAlreadyVotedDelegateTx = () => {
	const chainStateBuilder = new ChainStateBuilder(
		genesisBlock,
		initialAccountsState,
		accounts,
	);

	// Give balance from genesis account to delegates just for having account states to compare against
	// As the state builder is pretty basic so far we need to control forging only 25 transactions like this.
	let transactionCount = 0;
	// eslint-disable-next-line no-restricted-syntax
	for (const anAccount of genesisDelegateAccounts) {
		if (transactionCount === 25) {
			chainStateBuilder.forge();
			transactionCount = 0;
		}
		transactionCount += 1;

		chainStateBuilder
			.transfer('99')
			.from('2580432900309532760L')
			.to(anAccount.address);
	}
	// Fund account that will issue votes
	chainStateBuilder
		.transfer('101')
		.from('2580432900309532760L')
		.to('2222471382442610527L');

	// Forge the block so as to have all delegates in the store
	chainStateBuilder.forge();
	// Vote for an account is not a delegate
	chainStateBuilder
		.castVotesFrom('2222471382442610527L')
		.voteDelegates([
			'1cc68fa0b12521158e09779fd5978ccc0ac26bf99320e00a9549b542dd9ada16',
		])
		.unvoteDelegates([]);

	chainStateBuilder.forgeInvalidInputBlock();

	const chainAndAccountStates = chainStateBuilder.getScenario();

	return {
		initialState: {
			// Given the library chainStateBuilder saves all mutations we use slice here to pick the first accounts state
			chain: chainAndAccountStates.chain,
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

const generateTestCasesInvalidBlockWithUnvoteForDelegateNotPreviouslyVoted = () => {
	const initialAccountsStateUnvote = [
		{
			address: '2580432900309532760L',
			publicKey:
				'6f1195160a7f0d8a33883feafe567e79552d30f9e6d23a99676ebc04c15c95c5',
			secondPublicKey: null,
			username: null,
			isDelegate: false,
			secondSignature: false,
			balance: 9999899990000000,
			multiMin: 0,
			multiLifetime: 0,
			nameExist: false,
			missedBlocks: 0,
			producedBlocks: 0,
			rank: null,
			fees: 0,
			rewards: 0,
			vote: 0,
			productivity: 0,
		},
		{
			address: '4779466276403361478L',
			publicKey:
				'addb0e15a44b0fdc6ff291be28d8c98f5551d0cd9218d749e30ddb87c6e31ca9',
			secondPublicKey: null,
			username: 'genesis_100',
			isDelegate: true,
			secondSignature: false,
			balance: 0,
			multiMin: 0,
			multiLifetime: 0,
			nameExist: false,
			missedBlocks: 1,
			producedBlocks: 0,
			rank: 70,
			fees: 0,
			rewards: 0,
			vote: '10000000000000000',
			productivity: 0,
		},
		...genesisDelegateAccounts,
	];

	const accountsForUnvote = {
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
		aDelegate: {
			address: '4779466276403361478L',
			publicKey:
				'961cba94ea053793b965e97a208abbce8d98711bb993c03dde7901262b44272b',
			passphrase:
				'clown casino range cruel occur van absorb smoke punch mixture photo relief',
			balance: '0',
			delegateName: 'genesis_100',
		},
		votingAccount: {
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

	const chainStateBuilder = new ChainStateBuilder(
		genesisBlock,
		initialAccountsStateUnvote,
		accountsForUnvote,
	);

	// Give balance from genesis account to delegates just for having account states to compare against
	chainStateBuilder
		.transfer('10')
		.from('2580432900309532760L')
		.to('4779466276403361478L');

	// Fund account that will issue votes
	chainStateBuilder
		.transfer('10')
		.from('2580432900309532760L')
		.to('2222471382442610527L');

	// Forge the block so as to have all delegates in the store
	chainStateBuilder.forge();
	// Vote for an account is not a delegate
	chainStateBuilder
		.castVotesFrom('2222471382442610527L')
		.voteDelegates([])
		.unvoteDelegates([
			'addb0e15a44b0fdc6ff291be28d8c98f5551d0cd9218d749e30ddb87c6e31ca9',
		]);

	chainStateBuilder.forgeInvalidInputBlock();

	const chainAndAccountStates = chainStateBuilder.getScenario();

	return {
		initialState: {
			// Given the library chainStateBuilder saves all mutations we use slice here to pick the first accounts state
			chain: chainAndAccountStates.chain,
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

const validBlockWithVoteTxSuite = () => ({
	title: 'Valid block processing',
	summary: 'A valid block with votes transactions',
	config: 'mainnet',
	runner: 'block_processing_votes',
	handler: 'valid_block_processing_vote_all_delegates',
	testCases: generateTestCasesValidBlockVotesTx(),
});

const invalidBlockWithTooManyVotesTxSuite = () => ({
	title: 'Invalid block processing',
	summary: 'An invalid block with a vote transaction that exceeds max votes',
	config: 'mainnet',
	runner: 'block_processing_votes',
	handler: 'invalid_block_processing_vote_all_delegates_in_one_transaction',
	testCases: generateTestCasesInvalidBlockTooManyVotesTx(),
});

const invalidBlockWithVotesForNoDelegateTxSuite = () => ({
	title: 'Invalid block processing',
	summary: 'An invalid block with a vote transaction that exceeds max votes',
	config: 'mainnet',
	runner: 'block_processing_votes',
	handler: 'invalid_block_processing_vote_no_delegate',
	testCases: generateTestCasesInvalidBlockVoteNoDelegateTx(),
});

const invalidBlockWithVoteForVotedDelegateSuite = () => ({
	title: 'Invalid block processing',
	summary: 'An invalid block with a vote transaction that exceeds max votes',
	config: 'mainnet',
	runner: 'block_processing_votes',
	handler: 'invalid_block_processing_vote_already_voted_delegate',
	testCases: generateTestCasesInvalidBlockVoteAlreadyVotedDelegateTx(),
});

const invalidBlockWithUnvoteForDelegateNotPreviouslyVoted = () => ({
	title: 'Invalid block processing',
	summary: 'An invalid block with a vote transaction that exceeds max votes',
	config: 'mainnet',
	runner: 'block_processing_votes',
	handler: 'invalid_block_processing_unvote_not_voted_delegate',
	testCases: generateTestCasesInvalidBlockWithUnvoteForDelegateNotPreviouslyVoted(),
});

module.exports = BaseGenerator.runGenerator('block_processing_transfers', [
	validBlockWithVoteTxSuite,
	invalidBlockWithTooManyVotesTxSuite,
	invalidBlockWithVotesForNoDelegateTxSuite,
	invalidBlockWithVoteForVotedDelegateSuite,
	invalidBlockWithUnvoteForDelegateNotPreviouslyVoted,
]);
