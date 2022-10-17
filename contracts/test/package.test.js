const { network, ethers } = require("hardhat")
const { expect } = require("chai")
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const { networkConfig } = require("../helper-hardhat-config")

const BASE_FEE = ethers.utils.parseEther("0.25").toHexString() // 0.25 LINK per request
const GAS_PRICE_LINK = 1e9
const DECIMALS = "18"
const INITIAL_PRICE = ethers.utils.parseUnits("2000", "ether")
const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("0.01")

describe("Package", function () {
    let token
    let packageTracker, vrgCoordinatorV2Mock
    let owner, manager, producer, suplier, user
    let subscriptionId = 0

    async function deployAll() {
        const [Owner, Manager, Producer, Suplier, User] = await ethers.getSigners()
        owner = Owner
        manager = Manager
        producer = Producer
        suplier = Suplier
        user = User
        const chainId = network.config.chainId

        const VrfCoordinatorV2Mock = await ethers.getContractFactory("VRFCoordinatorV2Mock")
        vrgCoordinatorV2Mock = await VrfCoordinatorV2Mock.deploy(BASE_FEE, GAS_PRICE_LINK, {
            value: 0,
        })
        const txResponse = await vrgCoordinatorV2Mock.createSubscription()
        const txReceipt = await txResponse.wait()
        subscriptionId = txReceipt.events[0].args.subId
        await vrgCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT)
        const gasLane = networkConfig[chainId]["gasLane"]
        const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]

        const Package = await ethers.getContractFactory("Package")
        packageTracker = await Package.deploy(
            vrgCoordinatorV2Mock.address,
            subscriptionId,
            gasLane,
            callbackGasLimit,
            { value: 0 }
        )

        return {
            packageTracker,
            vrgCoordinatorV2Mock,
            owner,
            manager,
            producer,
            suplier,
            user,
        }
    }

    describe("Deployment", function () {
        it("is deployed", async () => {
            await loadFixture(deployAll)

            expect(true)
        })
    })
})
