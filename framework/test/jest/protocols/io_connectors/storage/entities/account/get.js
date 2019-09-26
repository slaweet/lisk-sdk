const { constants } = require('../../../../../utils');
const {
	sortedDelegateAccounts,
} = require('../../../../data/dpos/round_delegates');

const sortedDelegateAccountsProtocol = {
	args: [
		{
			isDelegate: true,
		},
		{
			limit: constants.ACTIVE_DELEGATES,
			sort: ['voteWeight:desc', 'publicKey:asc'],
		},
	],
	resolvedData: sortedDelegateAccounts,
};

module.exports = {
	sortedDelegateAccountsProtocol,
};
