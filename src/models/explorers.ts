import { SupportedChains } from '../constants/supported-chains';
import { TransactionData } from './transactionData';
import { TRANSACTION_APIS } from '../constants/api';

export interface ExplorerURLs {
  main: string;
  test: string;
}

export type TExplorerFunctionsArray = Array<{
  getTxData: (transactionId: string, chain?: SupportedChains) => Promise<TransactionData>;
  priority?: number;
}>;

export interface IParsingFunctionAPI {
  jsonResponse?: any; // the response from the service when called as rest
  chain?: SupportedChains; // TODO: look at how to deprecate this. Only used in etherscan
  key?: string; // identification key to pass to the service -> TODO: can this be merged into the serviceUrl? Only used in etherscan
  keyPropertyName?: string; // the key property to associate with the identification key -> TODO: can this be merged into the serviceUrl? Only used in etherscan
  transactionId?: string; // when using in RPCs we pass the tx id to look up since these functions are responsible for service lookup
  serviceUrl?: string; // the distant service url
}

export type TExplorerParsingFunction = ((data: IParsingFunctionAPI) => TransactionData) | ((data: IParsingFunctionAPI) => Promise<TransactionData>);

export interface ExplorerAPI {
  serviceURL?: string | ExplorerURLs;
  priority?: 0 | 1 | -1; // 0: custom APIs will run before the default APIs, 1: after, -1: reserved to default APIs
  parsingFunction?: TExplorerParsingFunction;
  serviceName?: TRANSACTION_APIS; // in case one would want to overload the default explorers
  key?: string; // the user's own key to the service
  keyPropertyName?: string; // the name of the property
  // apiType: whether the parsing function is calling a rpc or rest method.
  // RPC parsing functions are provided for BTC and ETH (EVM) chains.
  // defaults to 'rest'
  apiType?: 'rpc' | 'rest';
  // This library provides 2 types of RPC call parsing function,
  // one for Bitcoin ('btc') RPCs and one for Ethereum ('eth', alias 'evm') RPCs.
  // This option allows the consumer to use one of these function
  // defaults to 'eth'
  chainType?: 'btc' | 'evm' | 'eth';
}
