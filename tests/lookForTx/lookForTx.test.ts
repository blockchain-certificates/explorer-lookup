import sinon from 'sinon';
import { SupportedChains } from '../../src/constants/blockchains';
import * as explorers from '../../src/explorers';
import { TransactionData } from '../../src/models/TransactionData';
import CONFIG from '../../src/constants/config';
import lookForTx, { getExplorersByChain } from '../../src/lookForTx';
import { ExplorerAPI } from '../../src/models/Explorers';

describe('lookForTx test suite', function () {
  const MOCK_TRANSACTION_ID = 'mock-transaction-id';

  describe('given there are no custom explorers', function () {
    it('should call and resolve from the default explorers', async function () {
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

  describe('given some custom explorers are passed', function () {
    describe('when it is a valid custom explorer API object', function () {
      describe('and the custom explorer API is set an invalid priority', function () {
        it('should throw an error', async function () {
          const fixtureExplorerAPI: ExplorerAPI[] = [{
            serviceURL: 'https://explorer-example.com',
            priority: -1,
            parsingFunction: (): TransactionData => {
              return {
                remoteHash: 'a',
                issuingAddress: 'b',
                time: 'c',
                revokedAddresses: ['d']
              };
            }
          }];

          await expect(async () => {
            await lookForTx({
              transactionId: 'a-transaction-id',
              chain: SupportedChains.Bitcoin,
              explorerAPIs: fixtureExplorerAPI
            });
          }).rejects.toThrow('One or more of your custom explorer APIs has a priority set below 0 or above 1. ' +
            'Use 0 to give precedence to custom explorers over the default ones, or 1 for the contrary.');
        });
      });

      describe('and the custom explorer API has a missing parsing function', function () {
        it('should throw an error', async function () {
          const fixtureExplorerAPI: ExplorerAPI[] = [{
            serviceURL: 'https://explorer-example.com',
            priority: 0,
            parsingFunction: undefined
          }];

          await expect(async () => {
            await lookForTx({
              transactionId: 'a-transaction-id',
              chain: SupportedChains.Bitcoin,
              explorerAPIs: fixtureExplorerAPI
            });
          }).rejects.toThrow('One or more of your custom explorer APIs does not have a parsing function. ' +
            'Parsing functions are required to convert the data received from the explorer.');
        });
      });

      // describe('and the custom explorer API object is valid', function () {
      //   it('should set the explorerAPIs to the verifier object', function () {
      //     const fixture = Object.assign({}, verifierParamFixture);
      //     const fixtureExplorerAPI: ExplorerAPI[] = [{
      //       serviceURL: 'https://explorer-example.com',
      //       priority: 0,
      //       parsingFunction: (): TransactionData => {
      //         return {
      //           remoteHash: 'a',
      //           issuingAddress: 'b',
      //           time: 'c',
      //           revokedAddresses: ['d']
      //         };
      //       }
      //     }];
      //     fixture.explorerAPIs = fixtureExplorerAPI;
      //     const expectedExplorers: TExplorerAPIs = getDefaultExplorers();
      //     expectedExplorers.custom = explorerFactory(fixtureExplorerAPI);
      //     const verifierInstance = new Verifier(fixture);
      //     expect(JSON.stringify(verifierInstance.explorerAPIs)).toEqual(JSON.stringify(expectedExplorers));
      //   });
      // });

      // describe('and it references a default explorer API used for multiple blockchains', function () {
      //   let requestStub: sinon.SinonStub;
      //   const fixtureServiceURL = 'a-totally-custom-url';
      //
      //   beforeAll(function () {
      //     requestStub = sinon.stub(RequestService, 'request').resolves(JSON.stringify({}));
      //     const fixtureExplorerAPI: ExplorerAPI[] = [{
      //       serviceName: TRANSACTION_APIS.blockcypher,
      //       serviceURL: fixtureServiceURL,
      //       keyPropertyName: 'apiKey',
      //       key: 'a-custom-api-key',
      //       parsingFunction: () => ({ // prevent throwing error when executing
      //         remoteHash: 'a',
      //         issuingAddress: 'b',
      //         time: 'c',
      //         revokedAddresses: ['d']
      //       })
      //     }];
      //     instance = new Verifier({
      //       ...verifierParamFixture,
      //       explorerAPIs: fixtureExplorerAPI
      //     });
      //   });
      //
      //   afterAll(function () {
      //     requestStub.restore();
      //   });
      //
      //   it('should merge and overwrite the first occurrence of the default explorer API info with the provided one', async function () {
      //     await instance.explorerAPIs.ethereum[1].getTxData('transaction-id', SupportedChains.Ethmain);
      //     expect(requestStub.firstCall.args[0]).toEqual({ url: `${fixtureServiceURL}?apiKey=a-custom-api-key` });
      //   });
      //
      //   it('should merge and overwrite the second occurrence of the default explorer API info with the provided one', async function () {
      //     await instance.explorerAPIs.bitcoin[0].getTxData('transaction-id', SupportedChains.Bitcoin);
      //     expect(requestStub.secondCall.args[0]).toEqual({ url: `${fixtureServiceURL}?apiKey=a-custom-api-key` });
      //   });
      // });
    });
  });

  describe('given it is called with a transactionId and a chain', function () {
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
        expect(selectedSelectors.length).toBe(4);
      });
    });

    describe('given the chain is Bitcoin mocknet', function () {
      it('should use the bitcoin specific explorers', function () {
        const selectedSelectors = getExplorersByChain(SupportedChains.Mocknet, explorers.getDefaultExplorers());
        // because they are wrapped, we don't necessarily have the deep nature of the result, so we use a weak test to ensure
        expect(selectedSelectors.length).toBe(4);
      });
    });

    describe('given the chain is Bitcoin testnet', function () {
      it('should use the bitcoin specific explorers', function () {
        const selectedSelectors = getExplorersByChain(SupportedChains.Testnet, explorers.getDefaultExplorers());
        // because they are wrapped, we don't necessarily have the deep nature of the result, so we use a weak test to ensure
        expect(selectedSelectors.length).toBe(4);
      });
    });

    describe('given the chain is Bitcoin regtest', function () {
      it('should use the bitcoin specific explorers', function () {
        const selectedSelectors = getExplorersByChain(SupportedChains.Regtest, explorers.getDefaultExplorers());
        // because they are wrapped, we don't necessarily have the deep nature of the result, so we use a weak test to ensure
        expect(selectedSelectors.length).toBe(4);
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
