import request from '../../services/request.js';
import { stripHashPrefix } from '../../utils/stripHashPrefix.js';
import { buildTransactionServiceUrl } from '../../services/transaction-apis.js';
import { BLOCKCHAINS } from '../../constants/blockchains.js';
import { TRANSACTION_APIS, TRANSACTION_ID_PLACEHOLDER } from '../../constants/api.js';
import CONFIG from '../../constants/config.js';
import { SupportedChains } from '../../constants/supported-chains.js';
import { type TransactionData } from '../../models/transactionData';
import { type ExplorerAPI, type IParsingFunctionAPI } from '../../models/explorers';

const ETHEREUM_CHAIN_IDS: Partial<Record<SupportedChains, number>> = {
  [SupportedChains.Ethmain]: 1,
  [SupportedChains.Ethgoerli]: 5,
  [SupportedChains.Ethsepolia]: 11155111,
} as const;

function getApiBaseURL(chain: SupportedChains = SupportedChains.Ethmain): string {
  const chainId = ETHEREUM_CHAIN_IDS[chain];
  if (!chainId) {
    throw new Error(`Unsupported chain: ${chain}`);
  }
  return `https://api.etherscan.io/v2/api?chainid=${chainId}&module=proxy`;
}

function getTransactionServiceURL (chain: SupportedChains): string {
  const baseUrl = getApiBaseURL(chain);
  return `${baseUrl}&action=eth_getTransactionByHash&txhash=${TRANSACTION_ID_PLACEHOLDER}`;
}

// TODO: use tests/explorers/mocks/mockEtherscanResponse as type
async function parsingFunction ({ jsonResponse, chain, key, keyPropertyName }: IParsingFunctionAPI): Promise<TransactionData> {
  const baseUrl = getApiBaseURL(chain);
  const getBlockByNumberServiceUrls: Partial<ExplorerAPI> = {
    serviceURL: {
      main: `${baseUrl}&action=eth_getBlockByNumber&boolean=true&tag=${TRANSACTION_ID_PLACEHOLDER}`,
      test: `${baseUrl}&action=eth_getBlockByNumber&boolean=true&tag=${TRANSACTION_ID_PLACEHOLDER}`
    }
  };
  const getBlockNumberServiceUrls: Partial<ExplorerAPI> = {
    serviceURL: {
      main: `${baseUrl}&action=eth_blockNumber`,
      test: `${baseUrl}&action=eth_blockNumber`
    }
  };

  function parseEtherScanResponse (jsonResponse, block): TransactionData {
    const data = jsonResponse.result;
    const time: Date = new Date(parseInt(block.timestamp, 16) * 1000);
    const issuingAddress: string = data.from;
    const remoteHash = stripHashPrefix(data.input, BLOCKCHAINS.ethmain.prefixes); // remove '0x'

    // The method of checking revocations by output spent do not work with Ethereum.
    // There are no input/outputs, only balances.
    return {
      remoteHash,
      issuingAddress,
      time,
      revokedAddresses: []
    };
  }

  async function getEtherScanBlock (jsonResponse, chain: SupportedChains): Promise<any> {
    const data = jsonResponse.result;
    const blockNumber = data.blockNumber;
    const requestUrl = buildTransactionServiceUrl({
      explorerAPI: {
        ...getBlockByNumberServiceUrls,
        key,
        keyPropertyName
      } as ExplorerAPI,
      transactionId: blockNumber,
      chain
    });

    try {
      const response = await request({ url: requestUrl });
      const responseData = JSON.parse(response);
      const blockData = responseData.result;

      await checkEtherScanConfirmations(chain, blockNumber);
      return blockData;
    } catch (err) {
      throw new Error('Unable to get remote hash');
    }
  }

  async function checkEtherScanConfirmations (chain: SupportedChains, blockNumber: number): Promise<number> {
    const requestUrl: string = buildTransactionServiceUrl({
      explorerAPI: {
        ...getBlockNumberServiceUrls,
        key,
        keyPropertyName
      } as ExplorerAPI,
      chain
    });

    let response: string;
    try {
      response = await request({ url: requestUrl });
    } catch (err) {
      // TODO: not tested?
      throw new Error('Unable to get remote hash');
    }

    const responseData = JSON.parse(response);
    const currentBlockCount: number = responseData.result;

    if (currentBlockCount - blockNumber < CONFIG.MininumConfirmations) {
      // TODO: not tested
      throw new Error('Not enough');
    }
    return currentBlockCount;
  }

  // Parse block to get timestamp first, then create TransactionData
  const blockResponse = await getEtherScanBlock(jsonResponse, chain);
  return parseEtherScanResponse(jsonResponse, blockResponse);
}

export const explorerApi: ExplorerAPI = {
  serviceURL: getTransactionServiceURL,
  serviceName: TRANSACTION_APIS.etherscan,
  parsingFunction,
  priority: -1
};
