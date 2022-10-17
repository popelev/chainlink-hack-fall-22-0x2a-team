/* Imports */
const { ethers } = require("hardhat")

const VRF_COORDINATOR_GOERLI = process.env.VRF_COORDINATOR_GOERLI
const VRF_GAS_LANE_GOERLI = process.env.VRF_GAS_LANE_GOERLI
const CHAINLINK_TOKEN_GOERLI = process.env.CHAINLINK_TOKEN_GOERLI

const networkConfig = {
    4: {
        name: "goerli",
        vrfCoordinatorV2: VRF_COORDINATOR_GOERLI,
        entranceFee: ethers.utils.parseEther("0.01"),
        gasLane: VRF_GAS_LANE_GOERLI,
        subscriptionId: "7410",
        callbackGasLimit: "500000", // 500,000 gas
        mintFee: "10000000000000000", // 0.01 ETH
    },
    31337: {
        name: "hardhat",
        subscriptionId: "7410",
        entranceFee: ethers.utils.parseEther("0.01"),
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", // 30 gwei
        callbackGasLimit: "500000",
        mintFee: "10000000000000000",
    },
}

const developmentChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    developmentChains,
}
