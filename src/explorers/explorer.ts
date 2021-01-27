import { buildTransactionServiceUrl } from '../services/transaction-apis';
import { request } from '../services/request';
import { isTestChain, SupportedChains } from '../constants/blockchains';
import { TransactionData } from '../models/TransactionData';
import { ExplorerAPI, TExplorerFunctionsArray } from '../models/Explorers';
import { explorerApi as EtherscanApi } from './ethereum/etherscan';
import { explorerApi as BlockCypherETHApi } from './ethereum/blockcypher';
import { explorerApi as BlockExplorerApi } from './bitcoin/blockexplorer';
import { explorerApi as BlockstreamApi } from './bitcoin/blockstream';
import { explorerApi as BlockCypherBTCApi } from './bitcoin/blockcypher';
import { explorerApi as BitPayApi } from './bitcoin/bitpay';

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
    isTestApi: isTestChain(chain)
  });

  try {
    const response = await request({ url: requestUrl });
    return await explorerAPI.parsingFunction({
      jsonResponse: JSON.parse(response),
      chain,
      ...explorerAPI
    });
  } catch (err) {
    throw new Error('Unable to get remote hash');
  }
}

const BitcoinTransactionAPIArray = [
  BlockCypherBTCApi,
  BitPayApi,
  BlockExplorerApi,
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