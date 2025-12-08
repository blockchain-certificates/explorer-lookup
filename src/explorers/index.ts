import {
  BitcoinTransactionAPIArray as BitcoinExplorers,
  EthereumTransactionAPIArray as EthereumExplorers,
  explorerFactory
} from './explorer.js';
import { TRANSACTION_APIS } from '../constants/api.js';
import { ethereumRPCParsingFunction } from './rpc/ethereum.js';
import { bitcoinRPCParsingFunction } from './rpc/bitcoin.js';
import { type ExplorerAPI, type TExplorerFunctionsArray } from '../models/explorers';

export interface TDefaultExplorersPerBlockchain {
  bitcoin: TExplorerFunctionsArray;
  ethereum: TExplorerFunctionsArray;
}

export type TExplorerAPIs = TDefaultExplorersPerBlockchain & {
  custom?: TExplorerFunctionsArray;
};

function validateOverwritingExplorer (explorerAPI: ExplorerAPI): boolean {
  if (explorerAPI.key && !explorerAPI.keyPropertyName) {
    throw new Error(`Property keyPropertyName is not set for ${explorerAPI.serviceName}. Cannot pass the key property to the service.`);
  }
  return true;
}

export function overwriteDefaultExplorers(
    explorerAPIs = [],
    defaultExplorers = []
) {
  // Keep only custom explorers that have a valid serviceName and exist in TRANSACTION_APIS
  const validCustomExplorers = explorerAPIs.filter(
      explorer =>
          explorer &&
          explorer.serviceName &&
          TRANSACTION_APIS[explorer.serviceName]
  );

  if (!validCustomExplorers.length) {
    return defaultExplorers;
  }

  return defaultExplorers.map(defaultExplorer => {
    const customIndex = validCustomExplorers.findIndex(
        custom => custom.serviceName === defaultExplorer.serviceName
    );

    if (customIndex === -1) {
      // No custom override for this default
      return defaultExplorer;
    }

    const customExplorer = validCustomExplorers[customIndex];

    if (!validateOverwritingExplorer(customExplorer)) {
      // Invalid override, keep default
      return defaultExplorer;
    }

    // Remove the source from the original explorerAPIs array immediately
    const originalIndex = explorerAPIs.findIndex(
        explorer => explorer && explorer.serviceName === customExplorer.serviceName
    );
    if (originalIndex > -1) {
      explorerAPIs.splice(originalIndex, 1);
    }

    // Also remove from the local validCustomExplorers cache so we do not reuse it
    validCustomExplorers.splice(customIndex, 1);

    // Return an overwritten copy
    return Object.assign({}, defaultExplorer, customExplorer);
  });
}


export function getDefaultExplorers (explorerAPIs?: ExplorerAPI[]): TDefaultExplorersPerBlockchain {
  return {
    bitcoin: explorerFactory(overwriteDefaultExplorers(explorerAPIs, BitcoinExplorers)),
    ethereum: explorerFactory(overwriteDefaultExplorers(explorerAPIs, EthereumExplorers))
  };
}

function rpcFactory (explorerAPIs: ExplorerAPI[]): TExplorerFunctionsArray {
  return explorerAPIs.map(explorerAPI => {
    if (!explorerAPI.parsingFunction) {
      explorerAPI.parsingFunction = explorerAPI.chainType === 'btc' ? bitcoinRPCParsingFunction : ethereumRPCParsingFunction;
    }
    return explorerAPI;
  }).map(explorerAPI => (
    {
      getTxData: async (transactionId) => await explorerAPI.parsingFunction({
        ...explorerAPI,
        transactionId
      }),
      priority: explorerAPI.priority
    }
  ));
}

export function getRPCExplorers (customExplorerAPIs?: ExplorerAPI[]): Partial<TExplorerAPIs> {
  return {
    custom: rpcFactory(customExplorerAPIs)
  };
}

export function prepareExplorerAPIs (customExplorerAPIs: ExplorerAPI[]): TExplorerAPIs {
  const { bitcoin, ethereum } = getDefaultExplorers(customExplorerAPIs);
  const { custom: rpcCustomExplorers } = getRPCExplorers(customExplorerAPIs.filter(e => e.apiType === 'rpc'));
  const restCustomExplorers = explorerFactory(customExplorerAPIs.filter(e => e.apiType !== 'rpc'));

  return {
    bitcoin,
    ethereum,
    custom: [
      ...rpcCustomExplorers,
      ...restCustomExplorers
    ]
  };
}
