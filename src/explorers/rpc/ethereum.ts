import { TransactionData } from '../../models/transactionData';
import { stripHashPrefix } from '../../utils/stripHashPrefix';
import request from '../../services/request';
import { IParsingFunctionAPI } from '../../models/explorers';

export async function ethereumRPCParsingFunction ({ serviceUrl, transactionId }: IParsingFunctionAPI): Promise<TransactionData> {
  const transactionByHashParams = {
    method: 'eth_getTransactionByHash',
    jsonrpc: '2.0',
    id: 'getbyhash',
    params: [
      '0x' + transactionId
    ]
  };
  const resultTransactionByHash = await request({
    url: serviceUrl,
    body: transactionByHashParams,
    method: 'POST'
  });

  const transactionByHash = JSON.parse(resultTransactionByHash);

  const blockByNumberParams = {
    method: 'eth_getBlockByNumber',
    jsonrpc: '2.0',
    id: 'blockbynumber',
    params: [
      transactionByHash.result.blockNumber,
      true
    ]
  };
  const resultBlockByNumber = await request({
    url: serviceUrl,
    body: blockByNumberParams,
    method: 'POST'
  });
  // check confirm validity see cvjs etherscan

  const block = JSON.parse(resultBlockByNumber);

  const txData = transactionByHash.result;
  const blockData = block.result;
  const time = new Date(parseInt(blockData.timestamp, 16) * 1000);
  const issuingAddress = txData.from;
  const remoteHash = stripHashPrefix(txData.input, ['0x']); // remove '0x'

  return {
    remoteHash,
    issuingAddress,
    time,
    revokedAddresses: []
  };
}
