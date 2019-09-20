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

const stampit = require('stampit');
const randomstring = require('randomstring');

const accounts = {};

// Existing delegate account
accounts.existingDelegate = {
	address: '4103804705971278554L',
	publicKey: 'f834a69d7f017b649859ea85f0a0c649202a8fb4619afa96daed06fa5641746b',
	passphrase:
		'predict magic rebuild much rapid barely tuna push senior install soup village',
	balance: '0',
	delegateName: 'genesis_100',
};

// Genesis account, initially holding 100M total supply
accounts.genesis = {
	address: '12451387766827060593L',
	publicKey: '0b3dc5a506e312bac462afc4fb34cdc3b19d1976a279930d15ae3c3516edd188',
	passphrase:
		'bargain airport little hungry lake point need antique scout phrase team adjust',
	balance: '10000000000000000',
	encryptedPassphrase:
		'iterations=10&cipherText=a579bce90228ce05e9fcb19191c266bf5ff4b49bb78f94b0b80f166b3c5913e82e5aa0cb32ebd9fa9c09383a39dc6e0ce4b4d062815bec3023e207bb8088163f2fc481767e7100dd2e6635371ea9&iv=2ca3ad9581d0ae30085cf79d&salt=f411a5dcd61cde7a821d1df833e02f65&tag=42f278de8eaf61d8b377bb84eb1694ff&version=1',
	password: 'elephant tree paris dragon chair galaxy',
};

accounts.mem_accountsFields = [
	'username',
	'isDelegate',
	'secondSignature',
	'address',
	'publicKey',
	'secondPublicKey',
	'balance',
	'vote',
	'voteWeight',
	'rank',
	'delegates',
	'multisignatures',
	'multimin',
	'multilifetime',
	'nameexist',
	'producedBlocks',
	'missedBlocks',
	'fees',
	'rewards',
	'asset',
];

const Account = stampit({
	props: {
		username: '',
		isDelegate: false,
		secondSignature: false,
		address: '',
		publicKey: '',
		secondPublicKey: null,
		balance: '0',
		vote: '',
		voteWeight: '',
		rank: null,
		multiMin: 0,
		multiLifetime: 0,
		nameExist: false,
		producedBlocks: 9,
		missedBlocks: 0,
		fees: '0',
		rewards: '0',
		votedDelegatesPublicKeys: null,
		membersPublicKeys: null,
		productivity: 0,
		asset: {},
	},
	init({
		isDelegate,
		username,
		address,
		publicKey,
		secondPublicKey,
		producedBlocks,
		missedBlocks,
		balance,
		asset,
	}) {
		this.isDelegate = isDelegate || this.isDelegate;
		this.username = username || randomstring.generate(10).toLowerCase();
		this.address =
			address ||
			`${randomstring.generate({ charset: 'numeric', length: 20 })}L`;
		this.publicKey =
			publicKey ||
			randomstring
				.generate({ charset: '0123456789ABCDEF', length: 64 })
				.toLowerCase();
		this.secondPublicKey = secondPublicKey || null;
		this.vote = randomstring.generate({ charset: '123456789', length: 5 });
		this.voteWeight = this.vote;
		this.producedBlocks = producedBlocks || 0;
		this.missedBlocks = missedBlocks || 0;
		this.productivity =
			this.producedBlocks / (this.producedBlocks + this.missedBlocks) || 0;
		this.balance = balance || '0';
		this.asset = asset || {};
	},
});

const dbAccount = stampit({
	props: {
		address: null,
		balance: 0,
		delegates: null,
		fees: '0',
		isDelegate: 0,
		missedBlocks: 0,
		multiLifetime: 0,
		multimin: 0,
		multisignatures: null,
		nameExist: 0,
		producedBlocks: 0,
		publicKey: null,
		rank: null,
		rewards: '0',
		secondPublicKey: null,
		secondSignature: 0,
		username: null,
		vote: '0',
		voteWeight: '0',
		asset: {},
	},
	init({ address, balance }) {
		this.address = address || this.address;
		this.balance = balance || this.balance;
	},
});

const Delegate = stampit(Account, {
	props: {
		isDelegate: true,
	},
});

const Dependent = stampit({
	init({ accountId, dependentId }) {
		this.accountId = accountId;
		this.dependentId =
			dependentId ||
			randomstring
				.generate({ charset: '0123456789ABCDE', length: 32 })
				.toLowerCase();
	},
});

accounts.Account = Account;
accounts.dbAccount = dbAccount;
accounts.Delegate = Delegate;
accounts.Dependent = Dependent;

module.exports = accounts;
