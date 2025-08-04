import { describe, it, expect, beforeEach } from 'vitest';
import { buildTransactionServiceUrl } from '../../src/services/transaction-apis';
import { explorerApi as Blockcypher } from '../../src/explorers/bitcoin/blockcypher';
import { explorerApi as Etherscan } from '../../src/explorers/ethereum/etherscan';
import { SupportedChains } from '../../src/constants/supported-chains';

describe('Transaction APIs test suite', function () {
  let fixtureApi;
  const fixtureTransactionId = 'fixture-transaction-id';

  describe('buildTransactionServiceUrl method', function () {
    describe('handling test APIs', function () {
      beforeEach(function () {
        fixtureApi = Blockcypher;
      });

      describe('given chain is set to null', function () {
        it('should return the mainnet address with the transaction ID', function () {
          expect(buildTransactionServiceUrl({
            explorerAPI: fixtureApi,
            transactionId: fixtureTransactionId
          })).toEqual(`https://api.blockcypher.com/v1/btc/main/txs/${fixtureTransactionId}?limit=500`);
        });
      });

      describe('given chain is set to the testnet', function () {
        it('should return the testnet address with the transaction ID', function () {
          expect(buildTransactionServiceUrl({
            explorerAPI: fixtureApi,
            transactionId: fixtureTransactionId,
            chain: SupportedChains.Testnet
          })).toEqual(`https://api.blockcypher.com/v1/btc/test3/txs/${fixtureTransactionId}?limit=500`);
        });
      });
    });

    describe('handling Etherscan APIs', function () {
      beforeEach(function () {
        fixtureApi = Etherscan;
      });

      describe('given chain is set to null', function () {
        it('should return the mainnet address with the transaction ID', function () {
          expect(buildTransactionServiceUrl({
            explorerAPI: fixtureApi,
            transactionId: fixtureTransactionId
          })).toEqual(`https://api.etherscan.io/v2/api?chainid=1&module=proxy&action=eth_getTransactionByHash&txhash=${fixtureTransactionId}`);
        });
      });

      describe('given chain is set to the mainnet', function () {
        it('should return the mainnet address with the transaction ID', function () {
          expect(buildTransactionServiceUrl({
            explorerAPI: fixtureApi,
            transactionId: fixtureTransactionId,
            chain: SupportedChains.Ethmain
          })).toEqual(`https://api.etherscan.io/v2/api?chainid=1&module=proxy&action=eth_getTransactionByHash&txhash=${fixtureTransactionId}`);
        });
      });

      describe('given chain is set to the ropsten', function () {
        it('should return the ropsten address with the transaction ID', function () {
          expect(buildTransactionServiceUrl({
            explorerAPI: fixtureApi,
            transactionId: fixtureTransactionId,
            chain: SupportedChains.Ethropst
          })).toEqual(`https://api-ropsten.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${fixtureTransactionId}`);
        });
      });

      describe('given chain is set to the rinkeby', function () {
        it('should return the rinkeby address with the transaction ID', function () {
          expect(buildTransactionServiceUrl({
            explorerAPI: fixtureApi,
            transactionId: fixtureTransactionId,
            chain: SupportedChains.Ethrinkeby
          })).toEqual(`https://api-rinkeby.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${fixtureTransactionId}`);
        });
      });

      describe('given chain is set to the goerli', function () {
        it('should return the goerli address with the transaction ID', function () {
          expect(buildTransactionServiceUrl({
            explorerAPI: fixtureApi,
            transactionId: fixtureTransactionId,
            chain: SupportedChains.Ethgoerli
          })).toEqual(`https://api-goerli.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${fixtureTransactionId}`);
        });
      });

      describe('given chain is set to the sepolia', function () {
        it('should return the sepolia address with the transaction ID', function () {
          expect(buildTransactionServiceUrl({
            explorerAPI: fixtureApi,
            transactionId: fixtureTransactionId,
            chain: SupportedChains.Ethsepolia
          })).toEqual(`https://api-sepolia.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${fixtureTransactionId}`);
        });
      });

      describe('and the serviceURL is not set', function () {
        it('should throw', function () {
          expect(() => {
            buildTransactionServiceUrl({
              explorerAPI: JSON.parse(JSON.stringify(Etherscan))
            });
          }).toThrow('serviceURL is an unexpected type for explorerAPI etherscan');
        });
      });
    });

    describe('given it is called with an API token', function () {
      const fixtureAPIToken = 'a-test-api-token';

      beforeEach(function () {
        fixtureApi = JSON.parse(JSON.stringify(Etherscan));
        fixtureApi.serviceURL = Etherscan.serviceURL;
        fixtureApi.key = fixtureAPIToken;
        fixtureApi.keyPropertyName = 'apikey';
      });

      describe('and there are already some parameters in the URL', function () {
        it('should construct the URL to add the token with &', function () {
          const output = buildTransactionServiceUrl({
            explorerAPI: fixtureApi,
            transactionId: fixtureTransactionId
          });
          const expectedOutput = `https://api.etherscan.io/v2/api?chainid=1&module=proxy&action=eth_getTransactionByHash&txhash=${fixtureTransactionId}&apikey=${fixtureAPIToken}`;
          expect(output).toBe(expectedOutput);
        });
      });

      describe('and there are no parameters in the URL yet', function () {
        it('should construct the URL to add the token with ?', function () {
          fixtureApi.serviceURL = 'https://api.etherscan.io/v2/api';
          const output = buildTransactionServiceUrl({
            explorerAPI: fixtureApi,
            transactionId: fixtureTransactionId
          });
          const expectedOutput = `https://api.etherscan.io/v2/api?apikey=${fixtureAPIToken}`;
          expect(output).toBe(expectedOutput);
        });
      });

      describe('and the keyPropertyName is not set', function () {
        it('should throw', function () {
          delete fixtureApi.keyPropertyName;
          expect(() => {
            buildTransactionServiceUrl({
              explorerAPI: fixtureApi,
              transactionId: fixtureTransactionId
            });
          }).toThrow('No keyPropertyName defined for explorerAPI etherscan');
        });
      });
    });
  });
});
