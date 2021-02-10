import { stripHashPrefix } from '../../utils/stripHashPrefix';
import { timestampToDateObject } from '../../utils/date';
import { ExplorerAPI, ExplorerURLs, IParsingFunctionAPI, TRANSACTION_APIS, TransactionData } from '../../typings';
import { TRANSACTION_ID_PLACEHOLDER } from '../../constants/api';
import { BLOCKCHAINS } from '../../constants/blockchains';
import CONFIG from '../../constants/config';

// TODO: use tests/explorers/mocks/mockBlockexplorer as type
function parsingFunction ({ jsonResponse }: IParsingFunctionAPI): TransactionData {
  if (jsonResponse.confirmations < CONFIG.MininumConfirmations) {
    throw new Error('Number of transaction confirmations were less than the minimum required, according to Blockexplorer API');
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
  main: `https://blockexplorer.com/api/tx/${TRANSACTION_ID_PLACEHOLDER}`,
  test: `https://testnet.blockexplorer.com/api/tx/${TRANSACTION_ID_PLACEHOLDER}`
};

export const explorerApi: ExplorerAPI = {
  serviceURL,
  serviceName: TRANSACTION_APIS.blockexplorer,
  parsingFunction,
  priority: -1
};
