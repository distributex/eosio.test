const EOSTest = require('..');

it('tests hello contract', async (done) => {
  const eosTest = new EOSTest();
  console.log('init');
  await eosTest.init();
  console.log('build contract');
  await eosTest.make('./contracts/hello');
  await eosTest.newAccount('test', 'hello');
  console.log('deploy contract');
  const contract = await eosTest.deploy('hello', '../contracts/hello/hello.wasm', '../contracts/hello/hello.abi');
  console.log('call contract methods');
  await contract.hi('test', {authorization: 'test'});

  await eosTest.destroy();
  done();

}, 30000);

