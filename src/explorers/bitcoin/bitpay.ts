import { stripHashPrefix } from '../../utils/stripHashPrefix';
import { timestampToDateObject } from '../../utils/date';
import { ExplorerAPI, ExplorerURLs, IParsingFunctionAPI } from '../../models/explorers';
import { TransactionData } from '../../models/transactionData';
import { TRANSACTION_APIS, TRANSACTION_ID_PLACEHOLDER } from '../../constants/api';
import CONFIG from '../../constants/config';
import { BLOCKCHAINS } from '../../constants/blockchains';

// TODO: use tests/explorers/mocks/mockBitpayResponse as type
function parsingFunction ({ jsonResponse }: IParsingFunctionAPI): TransactionData {
  if (jsonResponse.confirmations < CONFIG.MininumConfirmations) {
    throw new Error('Number of transaction confirmations were less than the minimum required, according to Bitpay API');
  }
  const time: Date = timestampToDateObject(jsonResponse.blocktime);
  const outputs = jsonResponse.vout;
  const lastOutput = outputs[outputs.length - 1];
  const issuingAddress: string = jsonResponse.vout[0].scriptPubKey.addresses[0];
  const remoteHash: string = stripHashPrefix(lastOutput.scriptPubKey.hex, BLOCKCHAINS.bitcoin.prefixes);
  const revokedAddresses: string[] = outputs
    .filter(output => !!output.spentTxId)
    .map(output => output.scriptPubKey.addresses[0]);

  return {
    remoteHash,
    issuingAddress,
    time,
    revokedAddresses
  };
}

const serviceURL: ExplorerURLs = {
  main: `https://insight.bitpay.com/api/tx/${TRANSACTION_ID_PLACEHOLDER}`,
  test: `https://api.bitcore.io/api/BTC/testnet/tx/${TRANSACTION_ID_PLACEHOLDER}`
};

export const explorerApi: ExplorerAPI = {
  serviceURL,
  serviceName: TRANSACTION_APIS.bitpay,
  parsingFunction,
  priority: -1
};
