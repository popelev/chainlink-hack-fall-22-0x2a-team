require("@nomicfoundation/hardhat-toolbox")
require("hardhat-gas-reporter")
require("dotenv").config()

const PRIVATE_KEY = process.env.PRIVATE_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY

module.exports = {
    defaultNetwork: "hardhat",

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
