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

const randomInt = max =>
	Math.floor(Math.random() * max);

module.exports = {
	createAccount,
	createAccounts,
	createTransferTransaction,
	createDelegateTransaction,
	createVoteTransaction,
	randomInt,
};
