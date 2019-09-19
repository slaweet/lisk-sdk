# Block Processing Test Generator

A set of fixture generators for Transfer transactions

These generators make use of an experimental library for combining transactions, include them into blocks and generate chain/account states.
The library can be found in the file utils/chain_state_builder.js with this library it's possible to build scenarios fairly quickly with a fluent interface.

Transfer Lisk:

```javascript
chainStateBuilder
	.transfer('50')
	.from('11036225455433466506L')
	.to('7917418729031818208L')
	.forge();
```

Register Delegate:

```javascript
chainStateBuilder
	.registerDelegate('ADelegateName')
	.for('2222471382442610527L')
	.forge();
```

Cast Votes

```javascript
chainStateBuilder
	.castVotesFrom('2222471382442610527L')
	.voteDelegates([
		'eeeb0e15a44b0fdc6ff291be28d8c98f5551d0cd9218d749e30ddb87c6e31ca9',
		'aaab0e15a44b0fdc6ff291be28d8c98f5551d0cd9218d749e30ddb87c6e31ca9',
	])
	.unvoteDelegates([
		'ooob0e15a44b0fdc6ff291be28d8c98f5551d0cd9218d749e30ddb87c6e31ca9'
		'uuub0e15a44b0fdc6ff291be28d8c98f5551d0cd9218d749e30ddb87c6e31ca9',
	]);
```

Forge invalid input block (for cases where the final block should not be included):

```javascript
chainStateBuilder
	.transfer('0.5')
	.from('2222471382442610527L')
	.to('7917418729031818208L')
	.transfer('0.5')
	.from('2222471382442610527L')
	.to('11325618463998518034L')
	.forgeInvalidInputBlock();
```

Calls can also be chained:

```javascript
chainStateBuilder
	.transfer('50')
	.from('11036225455433466506L')
	.to('7917418729031818208L')
	.transfer('20')
	.from('7917418729031818208L')
	.to('22313731441670634663L')
	.forge();
```

Calling `forge()` generates a new block in the state so depending on how many times transfer and registerDelegate are called different combination of transactions will be included in a block.

## Resources

- [Spec link or LIP]()

## Comments

Further comments
