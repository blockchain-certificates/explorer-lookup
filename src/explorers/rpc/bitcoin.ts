import { TransactionData } from '../../models/transactionData';
import { stripHashPrefix } from '../../utils/stripHashPrefix';
import { timestampToDateObject } from '../../utils/date';
import request from '../../services/request';
import { IParsingFunctionAPI } from '../../models/explorers';

export async function bitcoinRPCParsingFunction ({ serviceUrl, transactionId }: IParsingFunctionAPI): Promise<TransactionData> {
  const getRawTransactionParams = {
    method: 'getrawtransaction',
    jsonrpc: '2.0',
    id: 'rpctest',
    params: [
      transactionId,
      true
    ]
  };
  const resultRawTransaction = await request({
    url: serviceUrl,
    body: getRawTransactionParams,
    method: 'POST'
  });

  const transaction = JSON.parse(resultRawTransaction).result;
  const issuingAddress = transaction.vout[0].scriptPubKey.addresses[0];
  const remoteHash = stripHashPrefix(transaction.vout[1].scriptPubKey.asm, ['6a20', 'OP_RETURN ']);
  const time = timestampToDateObject(transaction.blocktime);
  // after research, this only seems to be used in v1.2 of blockcerts.
  const revokedAddresses = transaction.vout
    .filter(output => !!output.scriptPubKey.addresses)
    .map(output => output.scriptPubKey.addresses)
    .flat();

  return {
    issuingAddress,
    remoteHash,
    time,
    revokedAddresses
  };
}
