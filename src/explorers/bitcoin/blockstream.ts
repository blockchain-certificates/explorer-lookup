import { stripHashPrefix } from '../../utils/stripHashPrefix';
import { timestampToDateObject } from '../../utils/date';
import { ExplorerAPI, ExplorerURLs, IParsingFunctionAPI, TRANSACTION_APIS, TransactionData } from '../../typings';
import { TRANSACTION_ID_PLACEHOLDER } from '../../constants/api';
import { BLOCKCHAINS } from '../../constants/blockchains';

// TODO: use tests/explorers/mocks/mockBlockstreamResponse as type
function parsingFunction ({ jsonResponse }: IParsingFunctionAPI): TransactionData {
  if (!jsonResponse.status.confirmed) {
    throw new Error('Number of transaction confirmations were less than the minimum required, according to Blockstream API');
  }
  const time: Date = timestampToDateObject(jsonResponse.status.block_time);
  const outputs = jsonResponse.vout;
  const lastOutput = outputs[outputs.length - 1];
  const issuingAddress: string = jsonResponse.vout[0].scriptpubkey_address;
  const remoteHash: string = stripHashPrefix(lastOutput.scriptpubkey, BLOCKCHAINS.bitcoin.prefixes);
  const revokedAddresses: string[] = outputs
    .filter(output => !!output.scriptpubkey_address)
    .map(output => output.scriptpubkey_address);
  return {
    remoteHash,
    issuingAddress,
    time,
    revokedAddresses
  };
}

const serviceURL: ExplorerURLs = {
  main: `https://blockstream.info/api/tx/${TRANSACTION_ID_PLACEHOLDER}`,
  test: `https://blockstream.info/testnet/api/tx/${TRANSACTION_ID_PLACEHOLDER}`
};

export const explorerApi: ExplorerAPI = {
  serviceURL,
  serviceName: TRANSACTION_APIS.blockstream,
  parsingFunction,
  priority: -1
};
