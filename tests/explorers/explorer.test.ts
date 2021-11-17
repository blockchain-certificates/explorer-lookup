import sinon from 'sinon';
import * as RequestService from '../../src/services/request';
import { explorerApi as BlockstreamAPI } from '../../src/explorers/bitcoin/blockstream';
import { explorerApi as BlockcypherAPI } from '../../src/explorers/bitcoin/blockcypher';
import * as mockBlockstreamResponse from './mocks/mockBlockstreamResponse.json';
import { explorerFactory, getTransactionFromApi } from '../../src/explorers/explorer';
import { BLOCKCHAINS } from '../../src/constants/blockchains';
import { ExplorerAPI } from '../../src/models/explorers';
import {
  getDefaultExplorers,
  getRPCExplorers,
  overwriteDefaultExplorers,
  prepareExplorerAPIs,
  TExplorerAPIs
} from '../../src/explorers';
import * as ethRPCExplorer from '../../src/explorers/rpc/ethereum';
import * as btcRPCExplorer from '../../src/explorers/rpc/bitcoin';
import { TransactionData } from '../../src/models/transactionData';
import { TRANSACTION_APIS } from '../../src/constants/api';

describe('Blockchain Explorers test suite', function () {
  const fixtureTransactionId = '2378076e8e140012814e98a2b2cb1af07ec760b239c1d6d93ba54d658a010ecd';
  const assertionRequestUrl = `https://blockstream.info/api/tx/${fixtureTransactionId}`;
  let stubRequest;
  const assertionResponse = {
    issuingAddress: '1AwdUWQzJgfDDjeKtpPzMfYMHejFBrxZfo',
    remoteHash: 'b2ceea1d52627b6ed8d919ad1039eca32f6e099ef4a357cbb7f7361c471ea6c8',
    revokedAddresses: ['1AwdUWQzJgfDDjeKtpPzMfYMHejFBrxZfo'],
    time: new Date(1518049414 * 1000)
  };

  beforeEach(function () {
    stubRequest = sinon.stub(RequestService, 'default').resolves(JSON.stringify(mockBlockstreamResponse));
  });

  afterEach(function () {
    stubRequest.restore();
  });

  describe('getTransactionFromApi method', function () {
    it('should call the right request API', async function () {
      await getTransactionFromApi(BlockstreamAPI, fixtureTransactionId, BLOCKCHAINS.bitcoin.code);
      expect(stubRequest.getCall(0).args).toEqual([{ url: assertionRequestUrl }]);
    });

    describe('given the API request failed', function () {
      it('should throw the right error', async function () {
        const fixtureError = new Error('Unable to get remote hash');
        stubRequest.rejects(fixtureError);
        await expect(getTransactionFromApi(BlockstreamAPI, fixtureTransactionId, BLOCKCHAINS.bitcoin.code))
          .rejects.toThrow('Unable to get remote hash');
      });
    });

    describe('given the request is successful', function () {
      describe('and the transaction data is generated from the response', function () {
        it('should return a correct transaction data', async function () {
          const res = await getTransactionFromApi(BlockstreamAPI, fixtureTransactionId, BLOCKCHAINS.bitcoin.code);
          expect(res).toEqual(assertionResponse);
        });
      });
    });
  });

  describe('overwriteDefaultExplorers method', function () {
    describe('given it was passed a default explorer match', function () {
      it('should overwrite the data of that default explorer', function () {
        const fixtureExplorer: ExplorerAPI = {
          serviceName: TRANSACTION_APIS.blockstream,
          key: 'a-custom-key',
          keyPropertyName: 'apiKey'
        };

        const mockDefaultExplorer: ExplorerAPI = Object.assign({}, BlockstreamAPI);

        const output = overwriteDefaultExplorers([fixtureExplorer], [mockDefaultExplorer, BlockcypherAPI]);
        expect(output.find(explorerAPI => explorerAPI.serviceName === fixtureExplorer.serviceName).key)
          .toBe(fixtureExplorer.key);
      });

      it('should return the list of default explorers with the one modified', function () {
        const fixtureExplorer: ExplorerAPI = {
          serviceName: TRANSACTION_APIS.blockstream,
          key: 'a-custom-key',
          keyPropertyName: 'apiKey'
        };

        const mockDefaultExplorer: ExplorerAPI = Object.assign({}, BlockstreamAPI);

        const output = overwriteDefaultExplorers([fixtureExplorer], [mockDefaultExplorer, BlockcypherAPI]);
        const expectedOutput = [Object.assign(mockDefaultExplorer, fixtureExplorer), BlockcypherAPI];
        expect(output).toEqual(expectedOutput);
      });

      describe('and the explorer overwrite is malformed', function () {
        describe('when a key is set but no keyPropertyName', function () {
          it('should throw an error', function () {
            const fixtureExplorer: ExplorerAPI = {
              serviceName: TRANSACTION_APIS.blockstream,
              key: 'a-custom-key'
            };

            expect(() => {
              overwriteDefaultExplorers([fixtureExplorer], [BlockstreamAPI, BlockcypherAPI]);
            }).toThrow('Property keyPropertyName is not set for blockstream. Cannot pass the key property to the service.');
          });
        });
      });
    });

    describe('given it was passed no default explorer match', function () {
      it('should return the list of default explorers as expected', function () {
        const fixtureExplorer: ExplorerAPI = {
          serviceURL: 'https//another-service.com/api',
          key: 'a-custom-key',
          keyPropertyName: 'apiKey'
        };

        const output = overwriteDefaultExplorers([fixtureExplorer], [BlockstreamAPI, BlockcypherAPI]);
        const expectedOutput = [BlockstreamAPI, BlockcypherAPI];
        expect(output).toEqual(expectedOutput);
      });
    });
  });

  describe('getDefaultExplorers method', function () {
    // This is hard to test from a data point of view since we are wrapping the explorers
    it('should wrap the explorers and expose the getTxData method', function () {
      const output = getDefaultExplorers();
      expect(output.bitcoin[0].getTxData).toBeDefined();
    });

    it('should return the default explorers for bitcoin', function () {
      const output = getDefaultExplorers();
      expect(output.bitcoin.length).toBe(2);
    });

    it('should return the default explorers for ethereum', function () {
      const output = getDefaultExplorers();
      expect(output.ethereum.length).toBe(2);
    });

    describe('when it is called with custom explorers', function () {
      describe('and one of the custom explorers matches one of the default explorers', function () {
        it('should return the same expected amount of default explorers', function () {
          const fixtureExplorer: ExplorerAPI = {
            serviceName: TRANSACTION_APIS.blockstream,
            key: 'a-custom-key',
            keyPropertyName: 'apiKey'
          };
          const output = getDefaultExplorers([fixtureExplorer]);
          expect(output.bitcoin.length).toBe(2);
          expect(output.ethereum.length).toBe(2);
        });
      });

      describe('and none of the custom explorers matches the default explorers', function () {
        it('should return the same expected amount of default explorers', function () {
          const fixtureExplorer: ExplorerAPI = {
            serviceURL: 'https//another-service.com/api',
            key: 'a-custom-key',
            keyPropertyName: 'apiKey'
          };
          const output = getDefaultExplorers([fixtureExplorer]);
          expect(output.bitcoin.length).toBe(2);
          expect(output.ethereum.length).toBe(2);
        });
      });
    });
  });

  describe('getRPCExplorers method', function () {
    describe('given it is called with an eth custom explorer', function () {
      it('should assign the ethereumRPCParsing function to retrieve the data', async function () {
        const fixtureExplorer: ExplorerAPI = {
          serviceURL: 'a-rpc-server.com',
          chainType: 'eth',
          priority: 0
        };

        const rpcFunctionName = 'ethereumRPCParsingFunction';
        sinon.stub(ethRPCExplorer, rpcFunctionName).resolves(`${rpcFunctionName} was called` as any);

        const explorers = getRPCExplorers([fixtureExplorer]);
        const testOutput = await explorers.custom[0].getTxData('test');
        expect(testOutput).toBe(`${rpcFunctionName} was called`);
        sinon.restore();
      });
    });

    describe('given it is called with an evm custom explorer', function () {
      it('should assign the ethereumRPCParsing function to retrieve the data', async function () {
        const fixtureExplorer: ExplorerAPI = {
          serviceURL: 'a-rpc-server.com',
          chainType: 'evm',
          priority: 0
        };

        const rpcFunctionName = 'ethereumRPCParsingFunction';
        sinon.stub(ethRPCExplorer, rpcFunctionName).resolves(`${rpcFunctionName} was called` as any);

        const explorers = getRPCExplorers([fixtureExplorer]);
        const testOutput = await explorers.custom[0].getTxData('test');
        expect(testOutput).toBe(`${rpcFunctionName} was called`);
        sinon.restore();
      });
    });

    describe('given it is called with a btc custom explorer', function () {
      it('should assign the bitcoinRPCParsingFunction to retrieve the data', async function () {
        const fixtureExplorer: ExplorerAPI = {
          serviceURL: 'a-rpc-server.com',
          chainType: 'btc',
          priority: 0
        };

        const rpcFunctionName = 'bitcoinRPCParsingFunction';
        sinon.stub(btcRPCExplorer, rpcFunctionName).resolves(`${rpcFunctionName} was called` as any);

        const explorers = getRPCExplorers([fixtureExplorer]);
        const testOutput = await explorers.custom[0].getTxData('test', '' as any);
        expect(testOutput).toBe(`${rpcFunctionName} was called`);
        sinon.restore();
      });
    });

    describe('given the chain type is not provided', function () {
      it('should assign the ethereumRPCParsingFunction to retrieve the data', async function () {
        const fixtureExplorer: ExplorerAPI = {
          serviceURL: 'a-rpc-server.com',
          priority: 0
        };

        const rpcFunctionName = 'ethereumRPCParsingFunction';
        sinon.stub(ethRPCExplorer, rpcFunctionName).resolves(`${rpcFunctionName} was called` as any);

        const explorers = getRPCExplorers([fixtureExplorer]);
        const testOutput = await explorers.custom[0].getTxData('test');
        expect(testOutput).toBe(`${rpcFunctionName} was called`);
        sinon.restore();
      });
    });

    describe('given the parsing function is provided', function () {
      it('should use the provided function to retrieve the data', async function () {
        const fixtureExplorer: ExplorerAPI = {
          serviceURL: 'a-rpc-server.com',
          priority: 0,
          parsingFunction: () => 'custom function was called' as any
        };

        const rpcFunctionName = 'ethereumRPCParsingFunction';
        sinon.stub(ethRPCExplorer, rpcFunctionName).resolves(`${rpcFunctionName} was called` as any);

        const explorers = getRPCExplorers([fixtureExplorer]);
        const testOutput = await explorers.custom[0].getTxData('test');
        expect(testOutput).toBe('custom function was called');
        sinon.restore();
      });
    });
  });

  describe('prepareExplorerAPIs function', function () {
    describe('given custom explorers are provided', function () {
      it('should return the explorers object with the custom explorers', function () {
        const fixtureCustomExplorerAPI: ExplorerAPI[] = [{
          serviceURL: 'https://explorer-example.com',
          priority: 0,
          parsingFunction: (): TransactionData => {
            return {
              remoteHash: 'a',
              issuingAddress: 'b',
              time: 'c',
              revokedAddresses: ['d']
            };
          }
        }];
        const expectedExplorers: TExplorerAPIs = getDefaultExplorers();
        expectedExplorers.custom = explorerFactory(fixtureCustomExplorerAPI);
        const output = prepareExplorerAPIs(fixtureCustomExplorerAPI);
        expect(JSON.stringify(output)).toEqual(JSON.stringify(expectedExplorers));
      });
    });

    describe('given no explorers are provided', function () {
      it('should return only the default explorers', function () {
        const expectedExplorers: TExplorerAPIs = getDefaultExplorers();
        expectedExplorers.custom = [];
        const output = prepareExplorerAPIs([]);
        expect(JSON.stringify(output)).toEqual(JSON.stringify(expectedExplorers));
      });
    });
  });
});
