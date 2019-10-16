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

const { when } = require('jest-when');
const { Dpos } = require('../../../../../../../../src/modules/chain/dpos');
const {
	delegatePublicKeys,
	delegateAccounts,
} = require('../../../../../../protocols/data/dpos/round_delegates');

const shuffledDelegatePublicKeys = require('./shuffled_delegate_publickeys_for_round_5.json');
const { constants } = require('../../../../../../utils');

/**
 * shuffledDelegatePublicKeys is created for the round: 5
 * If you need to update the round number or
 * need shuffled list for another round, please create/update
 * the list accordingly.
 */
const roundNo = 5;

describe('dpos.getForgerPublicKeysForRound()', () => {
	const stubs = {};
	let dpos;
	beforeEach(() => {
		// Arrange
		stubs.storage = {
			entities: {
				Account: {
					get: jest.fn(),
				},
				RoundDelegates: {
					getActiveDelegatesForRound: jest
						.fn()
						.mockReturnValue(delegatePublicKeys),
					create: jest.fn(),
					delete: jest.fn(),
				},
			},
		};

		stubs.channel = {
			subscribe: jest.fn(),
		};

		dpos = new Dpos({
			...stubs,
			activeDelegates: constants.ACTIVE_DELEGATES,
		});
	});

	describe('When non-shuffled delegate public keys exist in round_delegates table', () => {
		it('should return shuffled delegate public keys by using round_delegates table record', async () => {
			// Arrange
			when(stubs.storage.entities.RoundDelegates.getActiveDelegatesForRound)
				.calledWith(roundNo)
				.mockResolvedValue(delegatePublicKeys);

			// Act
			const list = await dpos.getForgerPublicKeysForRound(roundNo);

			// Assert
			expect(list).toEqual(shuffledDelegatePublicKeys);
		});
	});

	describe('Given the round is NOT in the round_delegates table', () => {
		it('should throw error when round is not in round_delegates table', async () => {
			// Arrange
			when(stubs.storage.entities.RoundDelegates.getActiveDelegatesForRound)
				.calledWith(roundNo)
				.mockResolvedValue([]);
			stubs.storage.entities.Account.get.mockResolvedValue(delegateAccounts);

			// Act && Assert
			return expect(dpos.getForgerPublicKeysForRound(roundNo)).rejects.toThrow(
				`No delegate list found for round: ${roundNo}`,
			);
		});
	});
});
