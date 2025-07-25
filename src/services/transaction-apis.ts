import { TRANSACTION_ID_PLACEHOLDER } from '../constants/api.js';
import { safelyAppendUrlParameter } from '../utils/url.js';
import { isTestChain } from '../constants/blockchains.js';
import { type ExplorerAPI } from '../models/explorers';
import { type SupportedChains } from '../constants/supported-chains';

function appendApiIdentifier (url: string, explorerAPI: ExplorerAPI): string {
  if (!explorerAPI.key) {
    return url;
  }

  if (explorerAPI.key && !explorerAPI.keyPropertyName) {
    throw new Error(`No keyPropertyName defined for explorerAPI ${explorerAPI.serviceName}`);
  }

  return safelyAppendUrlParameter(url, explorerAPI.keyPropertyName, explorerAPI.key);
}

export function buildTransactionServiceUrl ({
  explorerAPI,
  transactionIdPlaceholder = TRANSACTION_ID_PLACEHOLDER,
  transactionId = '',
  chain
}: {
  explorerAPI: ExplorerAPI;
  transactionIdPlaceholder?: string;
  transactionId?: string;
  chain?: SupportedChains;
}): string {
  const { serviceURL } = explorerAPI;
  let apiUrl: string;
  if (typeof serviceURL === 'string') {
    apiUrl = serviceURL;
  } else if (typeof serviceURL === 'object') {
    const isTestApi = chain ? isTestChain(chain) : false;
    apiUrl = isTestApi ? serviceURL.test : serviceURL.main;
  } else if (typeof serviceURL === 'function') {
    apiUrl = serviceURL(chain);
  } else {
    throw new Error(`serviceURL is an unexpected type for explorerAPI ${explorerAPI.serviceName}`);
  }
  apiUrl = apiUrl.replace(transactionIdPlaceholder, transactionId);
  apiUrl = appendApiIdentifier(apiUrl, explorerAPI);
  return apiUrl;
}
