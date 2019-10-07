const {
	creditTxs,
	registerTxs,
	voteTxs,
	type1,
	type2,
	type3,
	type4,
} = require('./prepare');
const { generateBlock } = require('./utils');
const { chainUtils, storageUtils, configUtils } = require('../utils');

const maxTxNum = 120;

jest.setTimeout(2147483647);

describe.only('benchmark', () => {
	const dbName = 'benchmark';
	process.env.NODE_ENV = 'test';
	const storage = new storageUtils.StorageSandbox(
		configUtils.storageConfig({ database: dbName }),
	);

	let chainModule;

	beforeAll(async () => {
		await storage.bootstrap();
		chainModule = await chainUtils.createAndLoadChainModule(dbName, {
			MAX_TRANSACTIONS_PER_BLOCK: 120,
		});
		await chainModule.forger.loadDelegates();
		const prepareTxs = [...creditTxs, ...registerTxs, ...voteTxs];
			const loopNum = Math.ceil(prepareTxs.length / maxTxNum);

			console.log(`creating ${loopNum} blocks`);

			for (let i = 0; i < loopNum; i++) {
				const txs = prepareTxs
					.slice(i * maxTxNum, (i + 1) * maxTxNum)
					.map(tx => chainModule.interfaceAdapters.transactions.fromJson(tx));
				console.log('forgeing', i);
				console.time('forge');
				const block = await generateBlock(chainModule.forger, txs);
				console.log(`Forged block ${block.id} with transactions ${block.transactions.length}`);
				console.timeEnd('forge');
			}
	});

	afterAll(async () => {
		await chainModule.cleanup();
		await storage.cleanup();
	});

	describe('', () => {
		it('start', async () => {
		});
	});
});
