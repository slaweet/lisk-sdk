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
	address: '11045666510866467680L',
	publicKey: 'e73c40e7a5470cfdfada5ef4eba84e48a400ac617e588369194f010288242b25',
	passphrase:
		'switch left awkward churn victory owner dress oil cat cactus slush surround',
	balance: '0',
	delegateName: 'genesis_100',
};

// Genesis account, initially holding 100M total supply
accounts.genesis = {
	address: '16172183803052839181L',
	publicKey: '862ca5c8fbc59d42a4dd76a0d883e00545cd42a56616810f90abdc6c19757a1f',
	passphrase:
		'peasant syrup tragic celery pupil attitude rough series mandate increase floor above',
	balance: '10000000000000000',
	encryptedPassphrase:
		'iterations=1&cipherText=0ed7ba9e846f85483f584e0c663289174cb818440a5456b563deb5a04749f96ff1de711e22c910aba317b8ac9d42a7981eda2ffc803b2e32acefdbddcfcb2d87916006e8595ecf41b4d86b3a1bfed75013cecffa&iv=2d2bc2307cd96f351525db96&salt=fcdfeae4bf08eaa69ab3ce65a3000872&tag=6aaa8c9363f6b2202222c87367ca2136&version=1',
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
