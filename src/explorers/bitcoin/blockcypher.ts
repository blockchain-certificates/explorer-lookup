import { stripHashPrefix } from '../../utils/stripHashPrefix';
import { dateToUnixTimestamp } from '../../utils/date';
import { ExplorerAPI, ExplorerURLs, IParsingFunctionAPI } from '../../models/explorers';
import { TransactionData } from '../../models/transactionData';
import { TRANSACTION_APIS, TRANSACTION_ID_PLACEHOLDER } from '../../constants/api';
import CONFIG from '../../constants/config';
import { BLOCKCHAINS } from '../../constants/blockchains';

// TODO: use tests/explorers/mocks/mockBlockcypher as type
function parsingFunction ({ jsonResponse }: IParsingFunctionAPI): TransactionData {
  if (jsonResponse.confirmations < CONFIG.MininumConfirmations) {
    throw new Error('Number of transaction confirmations were less than the minimum required, according to Blockcypher API');
  }
  const time: Date = dateToUnixTimestamp(jsonResponse.received);
  const outputs = jsonResponse.outputs;
  const lastOutput = outputs[outputs.length - 1];
  const issuingAddress: string = jsonResponse.inputs[0].addresses[0];
  const remoteHash: string = stripHashPrefix(lastOutput.script, BLOCKCHAINS.bitcoin.prefixes);
  const revokedAddresses: string[] = outputs
    .filter(output => !!output.spent_by)
    .map(output => output.addresses[0]);
  return {
    remoteHash,
    issuingAddress,
    time,
    revokedAddresses
  };
}

const serviceURL: ExplorerURLs = {
  main: `https://api.blockcypher.com/v1/btc/main/txs/${TRANSACTION_ID_PLACEHOLDER}?limit=500`,
  test: `https://api.blockcypher.com/v1/btc/test3/txs/${TRANSACTION_ID_PLACEHOLDER}?limit=500`
};

export const explorerApi: ExplorerAPI = {
  serviceURL,
  serviceName: TRANSACTION_APIS.blockcypher,
  parsingFunction,
  priority: -1
};
