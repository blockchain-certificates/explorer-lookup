import { BLOCKCHAINS } from './constants/blockchains';
import CONFIG from './constants/config';
import PromiseProperRace from './helpers/promiseProperRace';
import { TransactionData } from './models/transactionData';
import { prepareExplorerAPIs, TExplorerAPIs } from './explorers';
import { ExplorerAPI, TExplorerFunctionsArray } from './models/explorers';
import { SupportedChains } from './constants/supported-chains';

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
      return explorerAPIs.ethereum;
    default:
      if (!explorerAPIs.custom?.length) {
        throw new Error('Chain is not natively supported. Use custom explorers to retrieve tx data.');
      }
      return explorerAPIs.custom;
  }
}

// eslint-disable-next-line @typescript-eslint/promise-function-async
async function runPromiseRace (promises): Promise<TransactionData> {
  let winners;
  try {
    winners = await PromiseProperRace(promises, CONFIG.MinimumBlockchainExplorers);
  } catch (err) {
    throw new Error(`Transaction lookup error: ${err.message as string}`);
  }

  if (!winners || winners.length === 0) {
    // eslint-disable-next-line @typescript-eslint/return-await
    throw new Error('Could not confirm transaction data.');
  }

  const firstResponse = winners[0];
  for (let i = 1; i < winners.length; i++) {
    const thisResponse = winners[i];
    if (firstResponse.issuingAddress !== thisResponse.issuingAddress) {
      throw new Error('Issuing addresses do not match consistently');
    }
    if (firstResponse.remoteHash !== thisResponse.remoteHash) {
      throw new Error('Remote hashes do not match consistently');
    }
  }
  return firstResponse;
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
