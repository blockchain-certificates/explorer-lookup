import { buildTransactionServiceUrl } from '../services/transaction-apis.js';
import request from '../services/request.js';
import { explorerApi as EtherscanApi } from './ethereum/etherscan.js';
import { explorerApi as BlockCypherETHApi } from './ethereum/blockcypher.js';
import { explorerApi as BlockstreamApi } from './bitcoin/blockstream.js';
import { explorerApi as BlockCypherBTCApi } from './bitcoin/blockcypher.js';
import { type ExplorerAPI, type TExplorerFunctionsArray } from '../models/explorers';
import { type TransactionData } from '../models/transactionData';
import { type SupportedChains } from '../constants/supported-chains';

export function explorerFactory (TransactionAPIArray: ExplorerAPI[]): TExplorerFunctionsArray {
  return TransactionAPIArray
    .map(explorerAPI => (
      {
        getTxData: async (transactionId, chain) => await getTransactionFromApi(explorerAPI, transactionId, chain),
        priority: explorerAPI.priority
      }
    ));
}

export async function getTransactionFromApi (
  explorerAPI: ExplorerAPI,
  transactionId: string,
  chain: SupportedChains
): Promise<TransactionData> {
  const requestUrl = buildTransactionServiceUrl({
    explorerAPI,
    transactionId,
    chain
  });

  try {
    const response = await request({ url: requestUrl });
    return await explorerAPI.parsingFunction({
      jsonResponse: JSON.parse(response),
      chain,
      ...explorerAPI
    });
  } catch (err) {
    console.log('getTransactionFromApi error', err);
    throw new Error('Unable to get remote hash');
  }
}

const BitcoinTransactionAPIArray = [
  BlockCypherBTCApi,
  BlockstreamApi
];

const EthereumTransactionAPIArray = [
  EtherscanApi,
  BlockCypherETHApi
];

const BlockchainExplorersWithSpentOutputInfo = [
  BlockCypherBTCApi
];

export {
  BitcoinTransactionAPIArray,
  EthereumTransactionAPIArray,
  BlockchainExplorersWithSpentOutputInfo
};
