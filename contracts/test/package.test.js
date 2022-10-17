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

    xdescribe("constructor", async function () {
        it("Initialize packageTracker correctly", async function () {
            await loadFixture(deployAll)

            const vrfCoordinator = await packageTracker.getVrfCoordinatorAddress()

            expect(await packageTracker.name()).to.equal("QR-NFT Tracking")
            expect(await packageTracker.symbol()).to.equal("QNFTT")
            expect(vrfCoordinator.toString() !== "0x0000000000000000000000000000000000000000")
        })
    })

    describe("setManager", async function () {
        it("reverted if called by not owner", async function () {
            await loadFixture(deployAll)

            expect(await packageTracker.isManager(manager.address)).to.equal(false)
            await expect(
                packageTracker.connect(user).setManager(manager.address)
            ).to.be.revertedWith("Ownable: caller is not the owner")
            expect(await packageTracker.isManager(manager.address)).to.equal(false)
        })
        it("manager is setted correctly", async function () {
            await loadFixture(deployAll)

            expect(await packageTracker.isManager(manager.address)).to.equal(false)
            await packageTracker.setManager(manager.address)
            expect(await packageTracker.isManager(manager.address)).to.equal(true)
        })
    })

    describe("setProducer", async function () {
        it("reverted if called by not manager", async function () {
            await loadFixture(deployAll)

            expect(await packageTracker.isProducer(producer.address)).to.equal(false)
            await expect(
                packageTracker.connect(user).setProducer(producer.address)
            ).to.be.revertedWith("Caller is not the manager")
            expect(await packageTracker.isProducer(producer.address)).to.equal(false)
        })
        it("producer is setted correctly", async function () {
            await loadFixture(deployAll)

            await packageTracker.setManager(manager.address)
            expect(await packageTracker.isProducer(producer.address)).to.equal(false)
            await packageTracker.connect(manager).setProducer(producer.address)
            expect(await packageTracker.isProducer(producer.address)).to.equal(true)
        })
    })
})
