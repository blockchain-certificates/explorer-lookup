import sinon from 'sinon';
import { SupportedChains } from '../../src/constants/supported-chains';
import * as explorers from '../../src/explorers';
import { TransactionData } from '../../src/models/transactionData';
import CONFIG from '../../src/constants/config';
import lookForTx, { getExplorersByChain } from '../../src/lookForTx';

describe('lookForTx test suite', function () {
  const MOCK_TRANSACTION_ID = 'mock-transaction-id';

  describe('given there are no custom explorers', function () {
    it('should call and resolve from the explorers passed', async function () {
      const mockTxData: TransactionData = {
        revokedAddresses: [],
        time: '2020-04-20T00:00:00Z',
        remoteHash: 'a-remote-hash',
        issuingAddress: 'an-issuing-address'
      };
      const stubbedExplorer = sinon.stub().resolves(mockTxData);
      const mockExplorers: explorers.TExplorerAPIs = {
        bitcoin: [{
          getTxData: stubbedExplorer
        }],
        ethereum: []
      };
      const stubPrepareExplorerAPIs: sinon.SinonStub = sinon.stub(explorers, 'prepareExplorerAPIs').returns(mockExplorers);
      const output = await lookForTx({
        transactionId: 'a-transaction-id',
        chain: SupportedChains.Bitcoin
      });
      expect(output).toEqual(mockTxData);
      stubPrepareExplorerAPIs.restore();
    });
  });

  describe('given it is called with a transactionId, a chain and a certificateVersion', function () {
    describe('given the chain is invalid', function () {
      it('should throw an error', async function () {
        await expect(lookForTx({
          transactionId: MOCK_TRANSACTION_ID,
          chain: 'invalid-chain' as SupportedChains
        })).rejects.toThrow('Chain is not natively supported. Use custom explorers to retrieve tx data.');
      });
    });

    describe('given MinimumBlockchainExplorers is less than 0', function () {
      it('should throw an error', async function () {
        const originalValue = CONFIG.MinimumBlockchainExplorers;
        CONFIG.MinimumBlockchainExplorers = -1;
        await expect(lookForTx({
          transactionId: MOCK_TRANSACTION_ID,
          chain: SupportedChains.Bitcoin
        })).rejects.toThrow('Invalid application configuration;' +
          ' check the CONFIG.MinimumBlockchainExplorers configuration value');
        CONFIG.MinimumBlockchainExplorers = originalValue;
      });
    });

    describe('given MinimumBlockchainExplorers is higher than BlockchainExplorers length', function () {
      it('should throw an error', async function () {
        const originalValue = CONFIG.MinimumBlockchainExplorers;
        const defaultExplorerAPIs: explorers.TExplorerAPIs = explorers.getDefaultExplorers();
        CONFIG.MinimumBlockchainExplorers = defaultExplorerAPIs.bitcoin.length + 1;
        await expect(lookForTx({
          transactionId: MOCK_TRANSACTION_ID,
          chain: SupportedChains.Bitcoin
        })).rejects.toThrow('Invalid application configuration;' +
          ' check the CONFIG.MinimumBlockchainExplorers configuration value');
        CONFIG.MinimumBlockchainExplorers = originalValue;
      });
    });
  });
});

describe('getExplorersByChain test suite', function () {
  describe('selecting the explorers', function () {
    describe('given the chain is Ethereum main', function () {
      it('should use the ethereum specific explorers', function () {
        const selectedSelectors = getExplorersByChain(SupportedChains.Ethmain, explorers.getDefaultExplorers());
        // because they are wrapped, we don't necessarily have the deep nature of the result, so we use a weak test to ensure
        expect(selectedSelectors.length).toBe(2);
      });
    });

    describe('given the chain is Ethereum ropsten', function () {
      it('should use the ethereum specific explorers', function () {
        const selectedSelectors = getExplorersByChain(SupportedChains.Ethropst, explorers.getDefaultExplorers());
        // because they are wrapped, we don't necessarily have the deep nature of the result, so we use a weak test to ensure
        expect(selectedSelectors.length).toBe(2);
      });
    });

    describe('given the chain is Ethereum rinkeby', function () {
      it('should use the ethereum specific explorers', function () {
        const selectedSelectors = getExplorersByChain(SupportedChains.Ethrinkeby, explorers.getDefaultExplorers());
        // because they are wrapped, we don't necessarily have the deep nature of the result, so we use a weak test to ensure
        expect(selectedSelectors.length).toBe(2);
      });
    });

    describe('given the chain is Bitcoin mainnet', function () {
      it('should use the bitcoin specific explorers', function () {
        const selectedSelectors = getExplorersByChain(SupportedChains.Bitcoin, explorers.getDefaultExplorers());
        // because they are wrapped, we don't necessarily have the deep nature of the result, so we use a weak test to ensure
        expect(selectedSelectors.length).toBe(2);
      });
    });

    describe('given the chain is Bitcoin mocknet', function () {
      it('should use the bitcoin specific explorers', function () {
        const selectedSelectors = getExplorersByChain(SupportedChains.Mocknet, explorers.getDefaultExplorers());
        // because they are wrapped, we don't necessarily have the deep nature of the result, so we use a weak test to ensure
        expect(selectedSelectors.length).toBe(2);
      });
    });

    describe('given the chain is Bitcoin testnet', function () {
      it('should use the bitcoin specific explorers', function () {
        const selectedSelectors = getExplorersByChain(SupportedChains.Testnet, explorers.getDefaultExplorers());
        // because they are wrapped, we don't necessarily have the deep nature of the result, so we use a weak test to ensure
        expect(selectedSelectors.length).toBe(2);
      });
    });

    describe('given the chain is Bitcoin regtest', function () {
      it('should use the bitcoin specific explorers', function () {
        const selectedSelectors = getExplorersByChain(SupportedChains.Regtest, explorers.getDefaultExplorers());
        // because they are wrapped, we don't necessarily have the deep nature of the result, so we use a weak test to ensure
        expect(selectedSelectors.length).toBe(2);
      });
    });

    describe('in all other cases', function () {
      it('should return the custom explorers', function () {
        const customExplorers = {
          ...explorers.getDefaultExplorers(),
          custom: [
            {
              getTxData: () => '' as any,
              priority: 0
            }
          ]
        };
        const selectedSelectors = getExplorersByChain('Matic' as any, customExplorers);
        // because they are wrapped, we don't necessarily have the deep nature of the result, so we use a weak test to ensure
        expect(selectedSelectors.length).toBe(1);
      });
    });
  });
});
