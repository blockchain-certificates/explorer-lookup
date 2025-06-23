import { stripHashPrefix } from '../../utils/stripHashPrefix.js';
import { BLOCKCHAINS } from '../../constants/blockchains.js';
import { TRANSACTION_APIS, TRANSACTION_ID_PLACEHOLDER } from '../../constants/api.js';
import CONFIG from '../../constants/config.js';
import { dateToUnixTimestamp } from '../../utils/date.js';
import { prependHashPrefix } from '../../utils/prependHashPrefix.js';
import { type ExplorerAPI, type ExplorerURLs, type IParsingFunctionAPI } from '../../models/explorers';
import { type TransactionData } from '../../models/transactionData';

const serviceURL: ExplorerURLs = {
  main: `https://api.blockcypher.com/v1/eth/main/txs/${TRANSACTION_ID_PLACEHOLDER}?limit=500`,
  test: `https://api.blockcypher.com/v1/beth/test/txs/${TRANSACTION_ID_PLACEHOLDER}?limit=500`
};

// TODO: use tests/explorers/mocks/mockBlockcypherResponse as type
function parsingFunction ({ jsonResponse }: IParsingFunctionAPI): TransactionData {
  if (jsonResponse.confirmations < CONFIG.MininumConfirmations) {
    // TODO: not tested
    throw new Error('Not enough');
  }

  const time = dateToUnixTimestamp(jsonResponse.received);
  const outputs = jsonResponse.outputs;
  const lastOutput = outputs[outputs.length - 1];
  let issuingAddress: string = jsonResponse.inputs[0].addresses[0];
  const remoteHash = stripHashPrefix(lastOutput.script, BLOCKCHAINS.ethmain.prefixes);
  issuingAddress = prependHashPrefix(issuingAddress, BLOCKCHAINS.ethmain.prefixes);
  const revokedAddresses = outputs
    .filter(output => !!output.spent_by)
    .map(output => output.addresses[0]);
  return {
    remoteHash,
    issuingAddress,
    time,
    revokedAddresses
  };
}

export const explorerApi: ExplorerAPI = {
  serviceURL,
  serviceName: TRANSACTION_APIS.blockcypher,
  parsingFunction,
  priority: -1
};
