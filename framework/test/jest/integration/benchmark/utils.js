const {
	TransferTransaction,
	DelegateTransaction,
	VoteTransaction,
} = require('@liskhq/lisk-transactions');
const { Mnemonic } = require('@liskhq/lisk-passphrase');
const {
	getKeys,
	getAddressFromPublicKey,
} = require('@liskhq/lisk-cryptography');
const { getDelegateKeypairForCurrentSlot } = require('../../../../src/modules/chain/forger');

const createAccount = () => {
	const passphrase = Mnemonic.generateMnemonic();
	const { privateKey, publicKey } = getKeys(passphrase);
	const address = getAddressFromPublicKey(publicKey);

	return {
		passphrase,
		privateKey,
		publicKey,
		address,
	};
};

const createAccounts = (numberOfAccounts = 1) => {
	const accounts = new Array(numberOfAccounts).fill(0).map(createAccount);
	return accounts;
};

const createTransferTransaction = (passphrase, recipientId, amount) => {
	const transaction = new TransferTransaction({
		recipientId,
		amount,
	});
	transaction.sign(passphrase);
	return transaction.toJSON();
};

const createDelegateTransaction = (passphrase, username) => {
	const transaction = new DelegateTransaction({
		asset: {
			delegate: {
				username,
			},
		},
	});
	transaction.sign(passphrase);
	return transaction.toJSON();
};

const createVoteTransaction = (passphrase, upvotes = [], downvotes = []) => {
	const signedUpvotes = upvotes.map(v => `+${v}`);
	const signedDownvotes = downvotes.map(v => `-${v}`);
	const transaction = new VoteTransaction({
		asset: {
			votes: [...signedUpvotes, ...signedDownvotes],
		},
	});
	transaction.sign(passphrase);
	return transaction.toJSON();
};

const randomInt = max => Math.floor(Math.random() * max);

const generateBlock = async (forger, transactions) => {
	const currentSlot = forger.slots.getSlotTime(forger.slots.getSlotTime(forger.blocksModule.lastBlock.timestamp) + 1);
	// We calculate round using height + 1, because we want the delegate keypair for next block to be forged
	const round = forger.slots.calcRound(forger.blocksModule.lastBlock.height + 1);

	const delegateKeypair = await getDelegateKeypairForCurrentSlot(
		forger.roundsModule,
		forger.keypairs,
		currentSlot,
		round,
		forger.constants.activeDelegates,
	);

	if (delegateKeypair === null) {
		throw new Error('no delegate key pair');
	}

	return forger.blocksModule.generateBlock(
		delegateKeypair,
		forger.slots.getSlotTime(currentSlot),
		transactions,
	);
};

module.exports = {
	createAccount,
	createAccounts,
	createTransferTransaction,
	createDelegateTransaction,
	createVoteTransaction,
	randomInt,
	generateBlock,
};
