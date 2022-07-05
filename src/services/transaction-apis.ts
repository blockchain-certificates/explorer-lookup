import { ExplorerAPI } from '../models/explorers';
import { TRANSACTION_ID_PLACEHOLDER } from '../constants/api';
import { safelyAppendUrlParameter } from '../utils/url';
import { SupportedChains } from '../constants/supported-chains';
import { isTestChain } from '../constants/blockchains';

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
  chain = null
}: {
  explorerAPI: ExplorerAPI;
  transactionIdPlaceholder?: string;
  transactionId?: string;
  chain?: SupportedChains;
}): string {
  const { serviceURL, getTransactionServiceURL } = explorerAPI;
  let apiUrl: string;
  if (typeof serviceURL === 'string') {
    apiUrl = serviceURL;
  } else if (typeof serviceURL === 'object') {
    const isTestApi = chain ? isTestChain(chain) : false;
    apiUrl = isTestApi ? serviceURL.test : serviceURL.main;
  } else if (typeof getTransactionServiceURL === 'function') {
    apiUrl = getTransactionServiceURL(chain);
  } else {
    throw new Error(`No serviceURL/getTransactionServiceURL defined for explorerAPI ${explorerAPI.serviceName}`);
  }
  apiUrl = apiUrl.replace(transactionIdPlaceholder, transactionId);
  apiUrl = appendApiIdentifier(apiUrl, explorerAPI);
  return apiUrl;
}
