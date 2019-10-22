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
const { PerformanceObserver } = require('perf_hooks');
const debug = require('debug')('benchmark');

const obs = new PerformanceObserver(items => {
	debug(
		`name: ${items.getEntries()[0].name}, duration: ${
			items.getEntries()[0].duration
		}`,
	);
	// performance.clearMarks();
});
obs.observe({ entryTypes: ['measure'] });

const maxTxNum = 120;
const maxTimeout = Math.pow(2, 31) - 1;

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

		debug(`creating ${loopNum} blocks`);

		for (let i = 0; i < loopNum; i++) {
			const txs = prepareTxs
				.slice(i * maxTxNum, (i + 1) * maxTxNum)
				.map(tx => chainModule.interfaceAdapters.transactions.fromJson(tx));
			debug(`Forging ${i} / ${loopNum}`);
			const block = await generateBlock(chainModule.forger, txs);
			debug(
				`Forged block ${block.id} with transactions ${
					block.transactions.length
				}`,
			);
		}
	}, maxTimeout);

	afterAll(async () => {
		await chainModule.cleanup();
		await storage.cleanup();
	});

	describe('Test cases', () => {
		afterEach(async () => {
			await chainModule.processor.deleteLastBlock();
		});

		for (const i of new Array(100).fill(0)) {
			it('type 1', async () => {
				const txs = type1.map(tx =>
					chainModule.interfaceAdapters.transactions.fromJson(tx),
				);
				const block = await generateBlock(chainModule.forger, txs);
				debug(
					`Forged block ${block.id} with transactions ${
						block.transactions.length
					}`,
				);
			});

			it('type 2', async () => {
				const txs = type2.map(tx =>
					chainModule.interfaceAdapters.transactions.fromJson(tx),
				);
				const block = await generateBlock(chainModule.forger, txs);
				debug(
					`Forged block ${block.id} with transactions ${
						block.transactions.length
					}`,
				);
			});

			it('type 3', async () => {
				const txs = type3.map(tx =>
					chainModule.interfaceAdapters.transactions.fromJson(tx),
				);
				const block = await generateBlock(chainModule.forger, txs);
				debug(
					`Forged block ${block.id} with transactions ${
						block.transactions.length
					}`,
				);
			});

			it('type 4', async () => {
				const txs = type4.map(tx =>
					chainModule.interfaceAdapters.transactions.fromJson(tx),
				);
				const block = await generateBlock(chainModule.forger, txs);
				debug(
					`Forged block ${block.id} with transactions ${
						block.transactions.length
					}`,
				);
			});
		}
	});
});
