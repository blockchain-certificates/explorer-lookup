import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as mockEtherscanResponse from '../mocks/mockEtherscanResponse.json';
import { explorerApi } from '../../../src/explorers/ethereum/etherscan';
import * as RequestServices from '../../../src/services/request';
import { type TransactionData } from '../../../src/models/transactionData';
import { SupportedChains } from '../../../src/constants/supported-chains';

function getMockEtherscanResponse (): typeof mockEtherscanResponse {
  return JSON.parse(JSON.stringify(mockEtherscanResponse));
}

describe('Etherscan Explorer test suite', function () {
  describe('parsingFunction method', function () {
    let mockResponse;
    let stubRequest;

    beforeEach(function () {
      mockResponse = getMockEtherscanResponse();
      stubRequest = vi.spyOn(RequestServices, 'default');
    });

    afterEach(function () {
      vi.restoreAllMocks();
    });

    it('should return the transaction data', async function () {
      stubRequest.mockResolvedValue(JSON.stringify(mockResponse));
      const assertionTransactionData: TransactionData = {
        issuingAddress: '0x3d995ef85a8d1bcbed78182ab225b9f88dc8937c',
        remoteHash: 'ec049a808a09f3e8e257401e0898aa3d32a733706fd7d16aacf0ba95f7b42c0c',
        revokedAddresses: [],
        time: new Date('2019-06-02T08:38:26.000Z')
      };

      const res = await explorerApi.parsingFunction({ jsonResponse: mockResponse, chain: SupportedChains.Ethropst });
      expect(res).toEqual(assertionTransactionData);
    });

    describe('given the ether scan block cannot get retrieved', function () {
      it('should throw the right error', async function () {
        stubRequest.mockRejectedValue(new Error('rejected'));
        await expect(explorerApi.parsingFunction({ jsonResponse: mockResponse }))
          .rejects.toThrow('Unable to get remote hash');
      });
    });
  });
});
