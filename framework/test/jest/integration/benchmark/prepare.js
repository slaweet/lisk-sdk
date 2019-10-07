const {
	createAccounts,
	createTransferTransaction,
	createDelegateTransaction,
	createVoteTransaction,
} = require('./utils');

const genesisPassphrase = 'wagon stock borrow episode laundry kitten salute link globe zero feed marble';
const defaultAmount = '10000000000';

const delegates = createAccounts(101*120);
console.log('Created delegate accounts');

const voters = createAccounts(120);
console.log('Created voters accounts');

const nonVoters = createAccounts(120); 
console.log('Created non-voters accounts');

const defaultAccount = createAccounts(6); 
console.log('Created default accounts');

const newDelegates = createAccounts(115); 
console.log('Created new delegates accounts');

// Preparation
const creditTxs = [];
for (const account of [...delegates, ...voters, ...nonVoters, ...defaultAccount, ...newDelegates]) {
	creditTxs.push(createTransferTransaction(
		genesisPassphrase,
		account.address,
		defaultAmount,
	));
}
console.log('Created transfer txs');

const registerTxs = [];
for (const [i, delegate] of delegates.entries()) {
	registerTxs.push(createDelegateTransaction(
		delegate.passphrase,
		`delegate_${i}`,
	));
}

console.log('Created delegate txs');

const voteTxs = [];
for (const [i, voter] of voters.entries()) {
	voteTxs.push(createVoteTransaction(
		voter.passphrase,
		delegates.slice(i*101, (i+1)*101).map(d => d.publicKey),
	));
}

console.log('Created vote txs');

const type1 = [];
for (const account of nonVoters) {
	type1.push(createTransferTransaction(
		account.passphrase,
		'12345L',
		'1',
	));
}


console.log('Created type1 txs');

const type2 = [];
for (const account of voters) {
	type2.push(createTransferTransaction(
		account.passphrase,
		'12345L',
		'1',
	));
}

console.log('Created type2 txs');

const type3 = [];
for (const account of voters.slice(8)) {
	type3.push(createTransferTransaction(
		account.passphrase,
		'12345L',
		'1',
	));
}
for (const [i, account] of defaultAccount.entries()) {
	type3.push(createVoteTransaction(
		account.passphrase,
		delegates.slice(i*101, (i+1)*101).map(d => d.publicKey),
	));
}
console.log('Created type3 txs');

const type4 = [];
for (const [i, delegate] of newDelegates.entries()) {
	type4.push(createDelegateTransaction(
		delegate.passphrase,
		`new_delegate_${i}`,
	));
}
console.log('Created type4 txs');

module.exports = {
	creditTxs,
	registerTxs,
	voteTxs,
	type1,
	type2,
	type3,
	type4,
};
