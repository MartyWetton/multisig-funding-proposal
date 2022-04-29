# Multisig funding

Tornado governance proposal for multisig funding.

## Tests

1. Install dependencies:

```
    yarn install
```

2. Create `.env` file with actual values from `.env.sample`.

3. Run tests:

```
    yarn test
```

4. Run linter:

```
    yarn lint
```

## Deploy

1. Check `MultisigFundingProposal.sol` for actual hardcoded values.

2. Run deploy:

```
    npx hardhat run scripts/deploy.js --network mainnet
```

3. Verify on Etherscan:

```
    yarn hardhat verify --network mainnet <contract-address>
```
