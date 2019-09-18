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
	address: '7917418729031818208L',
	publicKey: '6fdfafcd8206c179d351baac5dc104a5ff46453e9d7f27f3e28ef38fc93d7799',
	passphrase:
		'honey lady pepper arch cluster uncover empty toss usual correct boil clay',
	balance: '0',
	delegateName: 'genesis_100',
};

// Genesis account, initially holding 100M total supply
accounts.genesis = {
	address: '11036225455433466506L',
	publicKey: 'd13a2659f908146f099da29216a18fd7f845b4e1455087b1a4bced79b6fefadf',
	passphrase:
		'amazing rose void lion bamboo maid electric involve feed way popular actor',
	balance: '10000000000000000',
	encryptedPassphrase:
		'iterations=1&cipherText=efd726ad67973f374caeda0f715571974789b99e70aa961129f295aa8e4c8d0bb39e321402fbcc126e8bf8630e17c13c4743702cd10343777ba17e443b7d444a76560538030e459afb3e&iv=8654394f37d831abdc5181be&salt=bbeee4479ae011704151acb23f0a889d&tag=44a42e50eb8bdc183fe68161856055b1&version=1',
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
