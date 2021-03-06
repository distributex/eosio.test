const { spawn, spawnSync } = require("child_process");
const eosjs = require("eosjs");
const fs = require("fs-extra");
const path = require("path");
const http = require("http");

async function sleep(delay_ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, delay_ms);
  });
}

class EOSEnv {
  constructor() {}

  async init() {
    const configDir = ".nodeos";
    await fs.remove(configDir);
    fs.copySync(path.join(path.dirname(__filename), "nodeos"), configDir);
    const logFd = fs.openSync(path.join(configDir, "nodeos.log"), "w");

    this.nodeos = spawn(
      `nodeos`, `-e -p eosio \
        --config-dir ${configDir} \
        --data-dir ${configDir} \
        --plugin eosio::chain_api_plugin \
        --plugin eosio::history_api_plugin \
        --max-irreversible-block-age ${2 ** 31 - 1} \
        --contracts-console \
        --access-control-allow-origin "*" \
        --access-control-allow-headers "*" \
        --access-control-allow-credentials true \
        --http-validate-host false`.split(' '),
      { stdio: ["ignore", logFd, logFd] }
    );

    process.on("exit", this.destroy.bind(this));

    fs.close(logFd);

    this.config = require("./config.json");

    const keyProvider = this.config.priv_key;
    this.api = eosjs({
      keyProvider,
      httpEndpoint: this.config.nodeos.endpoint
    });

    this.started = false;
    do {
      try {
        await this.api.getInfo({});
        this.started = true;
      } catch (e) {
        await sleep(1000);
      }
    } while (!this.started);
  }

  async destroy() {
    if (this.nodeos) {
      return new Promise((resolve, reject) => {
        console.log("killing nodeos", this.nodeos.pid);
        this.nodeos.on("error", reject);
        this.nodeos.on("exit", (code, signal) => {
          console.log(`nodeos process exited with a code ${code} and signal ${signal}`);
          resolve();
        });

        this.nodeos.kill("SIGTERM");
        this.nodeos = null;
      })
    }
  }

  async cmake(contractDir) {
    let cmake = spawnSync("cmake . && make", {
      shell: true,
      cwd: contractDir,
      stdio: "inherit"
    });
    if (cmake.status != 0) {
      throw Error(
        `failed to build a contrat \"${contractDir}\" ${cmake.stderr}`
      );
    }
  }

  async make(contractDir) {
    let make = spawnSync("make", {
      shell: true,
      cwd: contractDir,
      stdio: "inherit"
    });
    if (make.status != 0) {
      throw Error(
        `failed to build a contrat \"${contractDir}\" ${make.stderr}`
      );
    }
  }

  async deploy(code, wasmPath, abiPath) {
    const wasm = fs.readFileSync(wasmPath);
    const abi = fs.readFileSync(abiPath);

    await this.api.setcode(code, 0, 0, wasm);
    await this.api.setabi(code, JSON.parse(abi));
    return this.api.contract(code);
  }

  async newAccount(...accounts) {
    return await this.api.transaction(tr => {
      accounts.map(account => {
        tr.newaccount({
          creator: "eosio",
          name: account,
          owner: this.config.pub_key,
          active: this.config.pub_key
        });

        tr.buyrambytes({
          payer: "eosio",
          receiver: account,
          bytes: 8192
        });

        tr.delegatebw({
          from: "eosio",
          receiver: account,
          stake_net_quantity: "10.0000 SYS",
          stake_cpu_quantity: "10.0000 SYS",
          transfer: 0
        });
      });
    });
  }
}

module.exports = EOSEnv;
