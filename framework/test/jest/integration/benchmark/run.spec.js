const {
	creditTxs,
	registerTxs,
	voteTxs,
	type1,
	type2,
	type3,
	type4,
} = require('./prepare');
const { chainUtils, storageUtils, configUtils } = require('../utils');

describe.only('benchmark', () => {
	const dbName = 'benchmark';
	process.env.NODE_ENV = 'test';
	const storage = new storageUtils.StorageSandbox(
		configUtils.storageConfig({ database: dbName }),
	);

	let chainModule;

	beforeAll(async () => {
		await storage.bootstrap();
		chainModule = await chainUtils.createAndLoadChainModule(dbName);
	});

	afterAll(async () => {
		await chainModule.cleanup();
		await storage.cleanup();
	});

	it('start', async () => {
	});
});
