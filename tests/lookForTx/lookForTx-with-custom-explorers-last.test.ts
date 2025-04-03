import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { type TransactionData } from '../../src/models/transactionData';
import { SupportedChains } from '../../src/constants/supported-chains';
import lookForTx from '../../src/lookForTx';
import * as explorers from '../../src/explorers';

describe('lookForTx test suite', function () {
  const MOCK_TRANSACTION_ID = 'mock-transaction-id';
  const fixtureCustomTxData: TransactionData = {
    revokedAddresses: [],
    time: '2020-04-20T00:00:00Z',
    remoteHash: 'a-remote-hash',
    issuingAddress: 'from-custom-explorer'
  };

  const fixtureDefaultTxData: TransactionData = {
    revokedAddresses: [],
    time: '2020-04-20T00:00:00Z',
    remoteHash: 'a-remote-hash',
    issuingAddress: 'from-default-explorer'
  };

  describe('given it is invoked with custom explorers with priority 1', function () {
    let stubbedCustomExplorer: ReturnType<typeof vi.fn>;
    let stubbedDefaultExplorer: ReturnType<typeof vi.fn>;
    let stubbedPrepareExplorerAPIs: ReturnType<typeof vi.spyOn>;
    let mockExplorers: explorers.TExplorerAPIs;

    beforeEach(function () {
      stubbedCustomExplorer = vi.fn().mockResolvedValue(fixtureCustomTxData);
      stubbedDefaultExplorer = vi.fn().mockResolvedValue(fixtureDefaultTxData);
      mockExplorers = {
        bitcoin: [{
          getTxData: stubbedDefaultExplorer,
          priority: -1
        }],
        ethereum: [],
        custom: [{
          getTxData: stubbedCustomExplorer,
          priority: 1
        }]
      };
      stubbedPrepareExplorerAPIs = vi.spyOn(explorers, 'prepareExplorerAPIs').mockReturnValue(mockExplorers);
    });

    afterEach(function () {
      stubbedCustomExplorer.mockReset();
      stubbedDefaultExplorer.mockReset();
      stubbedPrepareExplorerAPIs.mockRestore();
    });

    describe('given the custom explorers return the transaction', function () {
      let response: TransactionData;

      beforeEach(async function () {
        response = await lookForTx({
          transactionId: MOCK_TRANSACTION_ID,
          chain: SupportedChains.Bitcoin
        });
      });

      it('should retrieve the response from the default explorers', function () {
        expect(response).toBe(fixtureDefaultTxData);
      });

      it('should have called the default explorers', function () {
        expect(stubbedDefaultExplorer).toHaveBeenCalledTimes(1);
      });

      it('should not have called the custom explorers', function () {
        expect(stubbedCustomExplorer).toHaveBeenCalledTimes(0);
      });
    });

    describe('given the default explorers fail to return the transaction', function () {
      let response: TransactionData;

      beforeEach(async function () {
        stubbedDefaultExplorer.mockRejectedValue(new Error('Default explorer failed'));
        response = await lookForTx({
          transactionId: MOCK_TRANSACTION_ID,
          chain: SupportedChains.Bitcoin
        });
      });

      it('should retrieve the response from the custom explorers', function () {
        expect(response).toBe(fixtureCustomTxData);
      });

      it('should have called the default explorers', function () {
        expect(stubbedDefaultExplorer).toHaveBeenCalledTimes(1);
      });

      it('should have called the custom explorers', function () {
        expect(stubbedCustomExplorer).toHaveBeenCalledTimes(1);
      });
    });
  });
});
