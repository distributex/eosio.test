const EOSTest = require('..');

it('tests hello contract', async (done) => {
  const eosTest = new EOSTest();
  console.log('init');
  await eosTest.init();
  console.log('build contract');
  await eosTest.make('./contracts/hello');
  console.log('create test account');
  await eosTest.newAccount('test');
  console.log('create hello account');
  await eosTest.newAccount('hello');
  console.log('deploy contract');
  const contract = await eosTest.deploy('hello', '../contracts/hello/hello.wasm', '../contracts/hello/hello.abi');
  console.log('call contract methods');
  await contract.hi('test', {authorization: 'test'});

  await eosTest.destroy();
  done();
  // TODO: fix exit
  console.log(process._getActiveRequests());
  console.log(process._getActiveHandles());
  process.exit();
}, 30000);

