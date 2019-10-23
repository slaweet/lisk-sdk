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

const BigNum = require('@liskhq/bignum');
const { getAddressFromPublicKey } = require('@liskhq/lisk-cryptography');

// TODO: change to more generic way
const TRANSACTION_TYPES_SEND = 0;
const TRANSACTION_TYPES_VOTE = 3;
const TRANSACTION_TYPES_IN_TRANSFER = 6;
const TRANSACTION_TYPES_OUT_TRANSFER = 7;

const revertVotes = votes =>
	votes.map(vote => {
		const sign = vote[0] === '+' ? '-' : '+';
		return `${sign}${vote.slice(1)}`;
	});

const updateDelegateVote = (
	stateStore,
	{ delegatePublicKey, amount, method },
) => {
	// FIXME: This hash potentially runs 101 * number of transactions now, so it should be searched by publickey
	const delegateAccount = stateStore.account.find(
		a => a.publicKey === delegatePublicKey,
	);
	if (!delegateAccount) {
		throw new Error('Delegate account is not prepared');
	}
	const voteBigNum = new BigNum(delegateAccount.voteWeight);
	const voteWeight = voteBigNum[method](amount).toString();
	// FIXME: immutable operation are too slow because this will be called 101 * number of transactions now
	delegateAccount.voteWeight = voteWeight;
	stateStore.account.set(delegateAccount.address, delegateAccount);
};

const getRecipientAddress = (stateStore, transaction) => {
	/**
	 *  If transaction type is IN_TRANSFER then,
	 * `recipientId` is the owner of dappRegistration transaction
	 */
	if (transaction.type === TRANSACTION_TYPES_IN_TRANSFER) {
		const dappTransaction = stateStore.transaction.get(
			transaction.asset.inTransfer.dappId,
		);
		return dappTransaction.senderId;
	}
	if (
		transaction.type === TRANSACTION_TYPES_SEND ||
		transaction.type === TRANSACTION_TYPES_OUT_TRANSFER ||
		transaction.type === TRANSACTION_TYPES_VOTE
	) {
		return transaction.asset.recipientId;
	}

	return null;
};

const revertVotedDelegatePublicKeys = (
	votedDelegatesPublicKeys,
	transaction,
	undo = false,
) => {
	const newVotes = undo
		? revertVotes(transaction.asset.votes)
		: transaction.asset.votes;
	const unvotedPublicKeys = newVotes
		.filter(vote => vote[0] === '-')
		.map(vote => vote.slice(1));
	const votedPublicKeys = newVotes
		.filter(vote => vote[0] === '+')
		.map(vote => vote.slice(1));

	/**
	 * We are returning the voted delegates from the time
	 * before this transaction was processed.
	 */
	return votedDelegatesPublicKeys
		.filter(vote => !votedPublicKeys.find(v => v === vote))
		.concat(unvotedPublicKeys);
};

const updateRecipientDelegateVotes = (
	stateStore,
	transaction,
	undo = false,
) => {
	const address = getRecipientAddress(stateStore, transaction);

	if (!address) {
		return false;
	}

	const {
		asset: { amount },
	} = transaction;
	const account = stateStore.account.get(address);
	const method = undo ? 'sub' : 'add';
	const votedDelegatesPublicKeys = account.votedDelegatesPublicKeys || [];

	for (const delegatePublicKey of votedDelegatesPublicKeys) {
		updateDelegateVote(stateStore, {
			delegatePublicKey,
			amount,
			method,
		});
	}
	return true;
};

const updateSenderDelegateVotes = (
	stateStore,
	transaction,
	exceptions,
	undo = false,
) => {
	// use the ammount or default to zero as LIP-0012 removes the 'amount' property from all transactions but transfer
	const amount = transaction.fee.plus(transaction.asset.amount || 0);
	const method = undo ? 'add' : 'sub';
	const senderAccount = stateStore.account.getOrDefault(transaction.senderId);
	let votedDelegatesPublicKeys = senderAccount.votedDelegatesPublicKeys || [];

	/**
	 * In testnet, one vote transaction was not processed correctly.
	 * Vote changes in the asset field was not processed, and fees
	 * were deducted from previous delegates whom sender already voted for.
	 * Thus we don't need to execute `revertVotedDelegatePublicKeys` for that
	 * transaction!
	 *
	 * @todo Remove if condition when we have testnet
	 */
	if (
		transaction.type === TRANSACTION_TYPES_VOTE &&
		(!exceptions.roundVotes || !exceptions.roundVotes.includes(transaction.id))
	) {
		/**
		 * When a vote transaction was processed, *account.votedDelegatesPublicKeys* will be
		 * updated based on asset field of the vote transaction. However, in this function
		 * we would like to deduct *fees* from delegates whom sender voted before this transaction.
		 * Thus we revert voted delegate public keys list.
		 *
		 * PS: We'll process votes in asset field in `updateDelegateVotes` function.
		 */
		votedDelegatesPublicKeys = revertVotedDelegatePublicKeys(
			votedDelegatesPublicKeys,
			transaction,
			undo,
		);
	}

	for (const delegatePublicKey of votedDelegatesPublicKeys) {
		updateDelegateVote(stateStore, {
			delegatePublicKey,
			amount,
			method,
		});
	}
};

const updateDelegateVotes = (stateStore, transaction, undo = false) => {
	/**
	 * If transaction is not VOTE transaction,
	 */
	if (transaction.type !== TRANSACTION_TYPES_VOTE) {
		return false;
	}

	const votes = undo
		? revertVotes(transaction.asset.votes)
		: transaction.asset.votes;

	for (const vote of votes) {
		const method = vote[0] === '+' ? 'add' : 'sub';
		const delegatePublicKey = vote.slice(1);

		const senderAccount = stateStore.account.get(transaction.senderId);
		const amount = new BigNum(senderAccount.balance).toString();
		updateDelegateVote(stateStore, {
			delegatePublicKey,
			amount,
			method,
		});
	}
	return true;
};

const apply = (stateStore, transaction, exceptions = {}) => {
	updateRecipientDelegateVotes(stateStore, transaction);
	updateSenderDelegateVotes(stateStore, transaction, exceptions);
	updateDelegateVotes(stateStore, transaction);
};

const undo = (stateStore, transaction, exceptions = {}) => {
	updateRecipientDelegateVotes(stateStore, transaction, true);
	updateSenderDelegateVotes(stateStore, transaction, exceptions, true);
	updateDelegateVotes(stateStore, transaction, true);
};

const prepare = async (stateStore, transactions) => {
	const publicKeys = transactions.map(transaction => {
		// Get delegate public keys whom sender voted for
		const senderVotedPublicKeys =
			stateStore.account.getOrDefault(transaction.senderId)
				.votedDelegatesPublicKeys || [];

		const recipientId = getRecipientAddress(stateStore, transaction);

		// Get delegate public keys whom recipient voted for
		const recipientVotedPublicKeys =
			(recipientId &&
				stateStore.account.getOrDefault(recipientId)
					.votedDelegatesPublicKeys) ||
			[];
		return {
			senderVotedPublicKeys,
			recipientVotedPublicKeys,
		};
	});

	const publicKeySet = new Set();
	for (const publicKey of publicKeys) {
		for (const pk of publicKey.senderVotedPublicKeys) {
			publicKeySet.add(pk);
		}
		for (const pk of publicKey.recipientVotedPublicKeys) {
			publicKeySet.add(pk);
		}
	}

	// Get unique public key list from merged arrays
	const senderRecipientVotedPublicKeys = Array.from(publicKeySet);

	if (senderRecipientVotedPublicKeys.length === 0) {
		return true;
	}

	const cacheFilter = senderRecipientVotedPublicKeys.map(publicKey => ({
		address: getAddressFromPublicKey(publicKey),
	}));

	return stateStore.account.cache(cacheFilter);
};

module.exports = {
	updateRecipientDelegateVotes,
	updateSenderDelegateVotes,
	updateDelegateVotes,
	apply,
	undo,
	prepare,
};
