import { BLOCKCHAINS } from './constants/blockchains.js';
import CONFIG from './constants/config.js';
import { SupportedChains } from './constants/supported-chains.js';
import { prepareExplorerAPIs, type TExplorerAPIs } from './explorers/index.js';
import { type TransactionData } from './models/transactionData';
import { type ExplorerAPI, type TExplorerFunctionsArray } from './models/explorers';

export function getExplorersByChain (chain: SupportedChains, explorerAPIs: TExplorerAPIs): TExplorerFunctionsArray {
  switch (chain) {
    case BLOCKCHAINS[SupportedChains.Bitcoin].code:
    case BLOCKCHAINS[SupportedChains.Regtest].code:
    case BLOCKCHAINS[SupportedChains.Testnet].code:
    case BLOCKCHAINS[SupportedChains.Mocknet].code:
      return explorerAPIs.bitcoin;
    case BLOCKCHAINS[SupportedChains.Ethmain].code:
    case BLOCKCHAINS[SupportedChains.Ethropst].code:
    case BLOCKCHAINS[SupportedChains.Ethrinkeby].code:
    case BLOCKCHAINS[SupportedChains.Ethgoerli].code:
    case BLOCKCHAINS[SupportedChains.Ethsepolia].code:
      return explorerAPIs.ethereum;
    default:
      if (!explorerAPIs.custom?.length) {
        throw new Error('Chain is not natively supported. Use custom explorers to retrieve tx data.');
      }
      return explorerAPIs.custom;
  }
}

export async function runPromiseRace(
    promises: Array<Promise<TransactionData>>
): Promise<TransactionData> {
  return new Promise((resolve, reject) => {
    if (!promises.length) {
      reject(new Error('No explorers configured'));
      return;
    }

    let pending = promises.length;
    let resolved = false;

    const markFailure = () => {
      pending -= 1;
      if (!resolved && pending === 0) {
        reject(new Error('Could not confirm transaction data.'));
      }
    };

    const isValidResponse = (res: TransactionData | undefined | null): res is TransactionData => {
      return !!res && !!res.issuingAddress && !!res.remoteHash;
    };

    for (const p of promises) {
      p.then(res => {
        if (resolved) return;

        if (!isValidResponse(res)) {
          markFailure();
          return;
        }

        // First valid answer wins
        resolved = true;
        resolve(res);
      })
      .catch(() => {
        // HTTP errors, thrown errors, etc.
        if (resolved) return;
        markFailure();
      });
    }
  });
}


type PromiseRaceQueue = TExplorerFunctionsArray[];

function buildQueuePromises (queue, transactionId, chain): any[] {
  if (CONFIG.MinimumBlockchainExplorers < 0 || CONFIG.MinimumBlockchainExplorers > queue.length) {
    throw new Error('Invalid application configuration; check the CONFIG.MinimumBlockchainExplorers configuration value');
  }

  const promises: any[] = [];
  const limit: number = CONFIG.Race ? queue.length : CONFIG.MinimumBlockchainExplorers;
  for (let i = 0; i < limit; i++) {
    promises.push(queue[i].getTxData(transactionId, chain));
  }

  return promises;
}

function buildPromiseRacesQueue (
  { defaultAPIs, customAPIs }:
  { defaultAPIs: TExplorerFunctionsArray; customAPIs: TExplorerFunctionsArray }
): PromiseRaceQueue {
  const promiseRaceQueue = [defaultAPIs];

  if (customAPIs?.length) {
    const priority: number = customAPIs[0].priority;
    promiseRaceQueue.splice(priority, 0, customAPIs);
  }

  const apisCount: number = defaultAPIs.concat(customAPIs).length;
  if (CONFIG.MinimumBlockchainExplorers < 0 || CONFIG.MinimumBlockchainExplorers > apisCount) {
    throw new Error('Invalid application configuration; check the CONFIG.MinimumBlockchainExplorers configuration value');
  }

  return promiseRaceQueue;
}

async function runQueueByIndex (queues, index: number, transactionId, chain): Promise<TransactionData> {
  try {
    const race = buildQueuePromises(queues[index], transactionId, chain);
    return await runPromiseRace(race);
  } catch (err) {
    if (index < queues.length - 1) {
      index++;
      return await runQueueByIndex(queues, index, transactionId, chain);
    }
    throw err;
  }
}

export default async function lookForTx (
  { transactionId, chain, explorerAPIs = [] }:
  { transactionId: string; chain: SupportedChains; explorerAPIs?: ExplorerAPI[] }
): Promise<TransactionData> {
  const preparedExplorerAPIs = prepareExplorerAPIs(explorerAPIs);
  const lookupQueues = buildPromiseRacesQueue({
    defaultAPIs: getExplorersByChain(chain, preparedExplorerAPIs),
    customAPIs: preparedExplorerAPIs.custom
  });

  // Run queue
  const currentQueueProcessedIndex = 0;
  return await runQueueByIndex(lookupQueues, currentQueueProcessedIndex, transactionId, chain);
}
