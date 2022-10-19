require("@nomicfoundation/hardhat-toolbox")
require("hardhat-deploy")
require("hardhat-gas-reporter")
require("dotenv").config()

const PRIVATE_KEY = process.env.PRIVATE_KEY
const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY

module.exports = {
    defaultNetwork: "goerli_fork",
    networks: {
        hardhat: {},
        goerli_fork: {
            url: "http://127.0.0.1:8545",
            chainId: 31337,
            forking: {
                url: GOERLI_RPC_URL,
            },
        },
        goerli: {
            chainId: 4,
            url: GOERLI_RPC_URL || "",
            accounts: [PRIVATE_KEY],
            blockConfirmations: 6,
        },
    },
    gasReporter: {
        enabled: true,
        outputFile: "gas-report.txt",
        noColors: true,
        currency: "USD",
        coinmarketcap: COINMARKETCAP_API_KEY,
        coin: "ETH",
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    solidity: { compilers: [{ version: "0.8.17" }, { version: "0.6.6" }] },
    namedAccounts: {
        deployer: {
            default: 0,
            deployer: 0,
        },
        user1: {
            default: 1,
            player1: 1,
        },
    },
    mocha: {
        timeout: 200000,
    },
    gasReporter: {
        enabled: process.env.REPORT_GAS ? true : false,
    },
}
