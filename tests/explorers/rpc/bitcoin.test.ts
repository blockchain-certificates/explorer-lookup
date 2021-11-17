import sinon from 'sinon';
import * as request from '../../../src/services/request';
import { bitcoinRPCParsingFunction } from '../../../src/explorers/rpc/bitcoin';

const getRawTransactionResponse = '{"result":{"txid":"d75b7a5bdb3d5244b753e6b84e987267cfa4ffa7a532a2ed49ad3848be1d82f8","hash":"d75b7a5bdb3d5244b753e6b84e987267cfa4ffa7a532a2ed49ad3848be1d82f8","version":1,"size":266,"vsize":266,"weight":1064,"locktime":0,"vin":[{"txid":"cbe1a820fd0512607d9cd41f3020770abc4ce015efb332a38b17598d981d26b9","vout":0,"scriptSig":{"asm":"304402207296a8a444e26cac6e0ab51e37fe96b59d406cab8ae61ca27332914052d9541202204b53a96e8d0bfca15dd5729d4ebee242cfd712138f7ccc1ae22451ff99750144[ALL] 04fddb3f9b745cb9dd54007164462597e607735cfe56baeef5a0b876c8bd16ee6115e3c77e2f74dc8129362e8c72e8dc4c27f4991f714754a57fd969f50e774e3d","hex":"47304402207296a8a444e26cac6e0ab51e37fe96b59d406cab8ae61ca27332914052d9541202204b53a96e8d0bfca15dd5729d4ebee242cfd712138f7ccc1ae22451ff99750144014104fddb3f9b745cb9dd54007164462597e607735cfe56baeef5a0b876c8bd16ee6115e3c77e2f74dc8129362e8c72e8dc4c27f4991f714754a57fd969f50e774e3d"},"sequence":4294967295}],"vout":[{"value":1.74630942,"n":0,"scriptPubKey":{"asm":"OP_DUP OP_HASH160 7fe4deec11117531349fc17d1217845fedf6e989 OP_EQUALVERIFY OP_CHECKSIG","hex":"76a9147fe4deec11117531349fc17d1217845fedf6e98988ac","reqSigs":1,"type":"pubkeyhash","addresses":["msBCHdwaQ7N2ypBYupkp6uNxtr9Pg76imj"]}},{"value":0.00000000,"n":1,"scriptPubKey":{"asm":"OP_RETURN f029b45bb1a7b1f0b970f6de35344b73cccd16177b4c037acbc2541c7fc27078","hex":"6a20f029b45bb1a7b1f0b970f6de35344b73cccd16177b4c037acbc2541c7fc27078","type":"nulldata"}}],"hex":"0100000001b9261d988d59178ba332b3ef15e04cbc0a7720301fd49c7d601205fd20a8e1cb000000008a47304402207296a8a444e26cac6e0ab51e37fe96b59d406cab8ae61ca27332914052d9541202204b53a96e8d0bfca15dd5729d4ebee242cfd712138f7ccc1ae22451ff99750144014104fddb3f9b745cb9dd54007164462597e607735cfe56baeef5a0b876c8bd16ee6115e3c77e2f74dc8129362e8c72e8dc4c27f4991f714754a57fd969f50e774e3dffffffff021ea8680a000000001976a9147fe4deec11117531349fc17d1217845fedf6e98988ac0000000000000000226a20f029b45bb1a7b1f0b970f6de35344b73cccd16177b4c037acbc2541c7fc2707800000000","blockhash":"0000000000000ce580a03ccdbd79b9a8c252eb6ab0741b196fcea81f1b47ca90","confirmations":746253,"time":1498774229,"blocktime":1498774229},"error":null,"id":"rpctest"}';

describe('Bitcoin RPC response parsing test suite', function () {
  describe('given it is called with a transactionId and a server URL', function () {
    it('should retrieve the transaction data', async function () {
      const requestStub: sinon.SinonStub = sinon.stub(request, 'default');
      const transactionId = 'd75b7a5bdb3d5244b753e6b84e987267cfa4ffa7a532a2ed49ad3848be1d82f8';
      const serviceUrl = 'a-btc-rpc-url.com';

      requestStub.onCall(0).resolves(getRawTransactionResponse);

      const output = await bitcoinRPCParsingFunction({ serviceUrl, transactionId });
      expect(output).toEqual({
        remoteHash: 'f029b45bb1a7b1f0b970f6de35344b73cccd16177b4c037acbc2541c7fc27078',
        issuingAddress: 'msBCHdwaQ7N2ypBYupkp6uNxtr9Pg76imj',
        time: new Date('2017-06-29T22:10:29.000Z'),
        revokedAddresses: ['msBCHdwaQ7N2ypBYupkp6uNxtr9Pg76imj']
      });
      requestStub.restore();
    });
  });
});
