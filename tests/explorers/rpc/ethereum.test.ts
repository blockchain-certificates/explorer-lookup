import sinon from 'sinon';
import { ethereumRPCParsingFunction } from '../../../src/explorers/rpc/ethereum';
import * as request from '../../../src/services/request';

const getByHashResponse = '{"jsonrpc":"2.0","id":"getbyhash","result":{"blockHash":"0xfb6e2f57468cdec12becc9b4dec4844e2efa7cc1ac87965a871c7d71133133dd","blockNumber":"0x46022a","from":"0x11f1089baceaa98dbe22c079c9df1e2338af22e1","gas":"0x5408","gasPrice":"0x3b9aca00","hash":"0xef59c07bed26d473925e688ec4da2211981820dc1167427ef34d2a2e6f45b8fa","input":"0x7122cbe07bafd8c243e8c2b684b38e32cc2493365d7ced1e7f1160cf99be835a","nonce":"0x7","to":"0x11f1089baceaa98dbe22c079c9df1e2338af22e1","transactionIndex":"0x0","value":"0x0","v":"0x27125","r":"0x92d2c281250f0241c26905b73a95c47b7757e05bd78bdc70b5265633929e9d3b","s":"0x2a22306868dca1c9c13b91d4dcedc9629071247085202e47de0fe525d963cd9"}}';

const blockByNumberResponse = '{"jsonrpc":"2.0","id":"blockbynumber","result":{"difficulty":"0x6","extraData":"0xd58301091083626f7286676f312e3133856c696e75780000000000000000000093a9198764b0db11a926e4edc7551ed22ce003321c138b50c9b91b4279f4afad38760444e5c0dc1fad9ed35d91486a45d05ba412c70ebbb3abfefc5a5151557b01","gasLimit":"0x1312d00","gasUsed":"0x5408","hash":"0xfb6e2f57468cdec12becc9b4dec4844e2efa7cc1ac87965a871c7d71133133dd","logsBloom":"0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000010000000000000000000000000000000000000000000000000800000000000800000000100000000004000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000080000000000000000000200000000000000000000000000000000000000000000000000000000000004000000000000000000001000000000000000000000000000000100040000000000000000000000000000000000000000000000000000010000000000000100000","miner":"0x0000000000000000000000000000000000000000","mixHash":"0x0000000000000000000000000000000000000000000000000000000000000000","nonce":"0x0000000000000000","number":"0x46022a","parentHash":"0x621e7cbb6e890c895af6250bd625d1ad2236d6c70aa6a1d3fd5a776b3db8109f","receiptsRoot":"0xc0eadd0b3b85cac44db93f86dd8d542020804132b95dbfb66570aae70c07f27f","sha3Uncles":"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347","size":"0x2ed","stateRoot":"0xfaff3d6e18f470fcee6d6fbf1322bfdec6d2604dba33305bbdc098582d491edd","timestamp":"0x5f6a082f","totalDifficulty":"0x173cc81","transactions":[{"blockHash":"0xfb6e2f57468cdec12becc9b4dec4844e2efa7cc1ac87965a871c7d71133133dd","blockNumber":"0x46022a","from":"0x11f1089baceaa98dbe22c079c9df1e2338af22e1","gas":"0x5408","gasPrice":"0x3b9aca00","hash":"0xef59c07bed26d473925e688ec4da2211981820dc1167427ef34d2a2e6f45b8fa","input":"0x7122cbe07bafd8c243e8c2b684b38e32cc2493365d7ced1e7f1160cf99be835a","nonce":"0x7","to":"0x11f1089baceaa98dbe22c079c9df1e2338af22e1","transactionIndex":"0x0","value":"0x0","v":"0x27125","r":"0x92d2c281250f0241c26905b73a95c47b7757e05bd78bdc70b5265633929e9d3b","s":"0x2a22306868dca1c9c13b91d4dcedc9629071247085202e47de0fe525d963cd9"}],"transactionsRoot":"0x91ed5bfce4b07bfae7174a05fed72e523ebe585bb970d2154d9c06af0a1ea22d","uncles":[]}}';

describe('Ethereum RPC response parsing test suite', function () {
  describe('given it is called with a transactionId and a server URL', function () {
    it('should retrieve the transaction data', async function () {
      const requestStub: sinon.SinonStub = sinon.stub(request, 'default');
      const transactionId = 'ef59c07bed26d473925e688ec4da2211981820dc1167427ef34d2a2e6f45b8fa';
      const serviceUrl = 'https://an-evm-rpc-explorer.com/';

      requestStub.onCall(0).resolves(getByHashResponse);
      requestStub.onCall(1).resolves(blockByNumberResponse);

      const output = await ethereumRPCParsingFunction({ serviceUrl, transactionId });
      expect(output).toEqual({
        remoteHash: '7122cbe07bafd8c243e8c2b684b38e32cc2493365d7ced1e7f1160cf99be835a',
        issuingAddress: '0x11f1089baceaa98dbe22c079c9df1e2338af22e1',
        time: new Date('2020-09-22T14:20:31.000Z'),
        revokedAddresses: []
      });

      requestStub.restore();
    });
  });
});
