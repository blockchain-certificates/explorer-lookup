import { SupportedChains } from '../src/constants/blockchains';
import { ExplorerAPI } from '../src/models/Explorers';
import { TransactionData } from '../src/models/TransactionData';

export declare async function lookForTx (
  { transactionId, chain, explorerAPIs = [] }: { transactionId: string; chain: SupportedChains; explorerAPIs?: ExplorerAPI[] }
): Promise<TransactionData>;
