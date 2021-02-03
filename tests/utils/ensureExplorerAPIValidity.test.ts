import { ExplorerAPI } from '../../src/models/Explorers';
import { TransactionData } from '../../src/models/TransactionData';
import ensureExplorerAPIValidity from '../../src/utils/ensureExplorerAPIValidity';

describe('ensureExplorerAPIValidity test suite', function () {
  describe('given at least one custom explorer has a priority value under 0', function () {
    const fixtureExplorerAPIs: ExplorerAPI[] = [{
      serviceURL: 'https://fixture-url.tld',
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

    it('should throw the right error', function () {
      expect(() => {
        ensureExplorerAPIValidity(fixtureExplorerAPIs);
      }).toThrow('One or more of your custom explorer APIs has a priority set below 0 or above 1. ' +
        'Use 0 to give precedence to custom explorers over the default ones, or 1 for the contrary.');
    });
  });

  describe('given at least one custom explorer\'s parsing function is missing', function () {
    const fixtureExplorerAPIs: ExplorerAPI[] = [{
      serviceURL: 'https://fixture-url.tld',
      priority: 0,
      parsingFunction: undefined
    }];

    it('should throw the right error', function () {
      expect(() => {
        ensureExplorerAPIValidity(fixtureExplorerAPIs);
      }).toThrow('One or more of your custom explorer APIs does not have a parsing function. ' +
        'Parsing functions are required to convert the data received from the explorer.');
    });
  });

  describe('given everything is as expected', function () {
    const fixtureExplorerAPIs: ExplorerAPI[] = [{
      serviceURL: 'https://fixture-url.tld',
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

    it('should return true', function () {
      const test = ensureExplorerAPIValidity(fixtureExplorerAPIs);
      expect(test).toBe(true);
    });
  });
});
