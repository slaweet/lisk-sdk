/*
 * Copyright © 2017 Lisk Foundation
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
 *
 */
import send from './0_send';
import sendFromMultisignatureAccount from './0_sendFromMultisignatureAccount';
import registerSecondPassphrase from './1_registerSecondPassphrase';
import registerDelegate from './2_registerDelegate';
import castVotes from './3_castVotes';
import registerMultisignature from './4_registerMultisignatureAccount';
import createDapp from './5_createDapp';
import transferIntoDapp from './6_transferIntoDapp';
import transferOutOfDapp from './7_transferOutOfDapp';

export default {
	send,
	sendFromMultisignatureAccount,
	registerSecondPassphrase,
	registerDelegate,
	castVotes,
	registerMultisignature,
	createDapp,
	transferIntoDapp,
	transferOutOfDapp,
};
