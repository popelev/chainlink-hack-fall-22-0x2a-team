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
    let packageTracker, vrgCoordinatorV2Mock
    let owner, manager, producer, suplier, user
    let subscriptionId

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

        await vrgCoordinatorV2Mock.addConsumer(subscriptionId.toNumber(), packageTracker.address)

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
    beforeEach(async function () {
        await loadFixture(deployAll)
    })

    describe("constructor", async function () {
        it("Initialize packageTracker correctly", async function () {
            expect(await packageTracker.name()).to.equal("QR-NFT Tracking")
            expect(await packageTracker.symbol()).to.equal("QNFTT")
            expect(
                vrgCoordinatorV2Mock.address.toString() !==
                    "0x0000000000000000000000000000000000000000"
            )
            expect(vrgCoordinatorV2Mock.address).to.equal(
                await packageTracker.getVrfCoordinatorAddress()
            )
            expect(await packageTracker.getVrfCoordinatorSubId()).to.equal(subscriptionId)
            expect(
                await vrgCoordinatorV2Mock.consumerIsAdded(
                    subscriptionId.toNumber(),
                    packageTracker.address
                )
            )
        })
    })

    xdescribe("setManager", async function () {
        it("reverted if called by not owner", async function () {
            expect(await packageTracker.isManager(manager.address)).to.equal(false)
            await expect(
                packageTracker.connect(user).setManager(manager.address)
            ).to.be.revertedWith("Ownable: caller is not the owner")
            expect(await packageTracker.isManager(manager.address)).to.equal(false)
        })
        it("manager is setted correctly", async function () {
            expect(await packageTracker.isManager(manager.address)).to.equal(false)
            await packageTracker.setManager(manager.address)
            expect(await packageTracker.isManager(manager.address)).to.equal(true)
        })
    })

    xdescribe("resetManager", async function () {
        beforeEach(async function () {
            await packageTracker.setManager(manager.address)
            await packageTracker.connect(manager).setProducer(producer.address)
        })

        it("reverted if called by not owner", async function () {
            expect(await packageTracker.isManager(manager.address)).to.equal(true)
            await expect(
                packageTracker.connect(user).resetManager(manager.address)
            ).to.be.revertedWith("Ownable: caller is not the owner")
            expect(await packageTracker.isManager(manager.address)).to.equal(true)
        })
        it("manager is resetted correctly", async function () {
            expect(await packageTracker.isManager(manager.address)).to.equal(true)
            await packageTracker.resetManager(manager.address)
            expect(await packageTracker.isManager(manager.address)).to.equal(false)
        })
    })

    xdescribe("setProducer", async function () {
        it("reverted if called by not manager", async function () {
            expect(await packageTracker.isProducer(producer.address)).to.equal(false)
            await expect(
                packageTracker.connect(user).setProducer(producer.address)
            ).to.be.revertedWith("Caller is not the manager")
            expect(await packageTracker.isProducer(producer.address)).to.equal(false)
        })
        it("producer is setted correctly", async function () {
            await packageTracker.setManager(manager.address)
            expect(await packageTracker.isProducer(producer.address)).to.equal(false)
            await packageTracker.connect(manager).setProducer(producer.address)
            expect(await packageTracker.isProducer(producer.address)).to.equal(true)
        })
    })

    xdescribe("resetProducer", async function () {
        beforeEach(async function () {
            await packageTracker.setManager(manager.address)
            await packageTracker.connect(manager).setProducer(producer.address)
        })

        it("reverted if called by not manager", async function () {
            expect(await packageTracker.isProducer(producer.address)).to.equal(true)
            await expect(
                packageTracker.connect(user).setProducer(producer.address)
            ).to.be.revertedWith("Caller is not the manager")
            expect(await packageTracker.isProducer(producer.address)).to.equal(true)
        })
        it("producer is setted correctly", async function () {
            expect(await packageTracker.isProducer(producer.address)).to.equal(true)
            await packageTracker.connect(manager).resetProducer(producer.address)
            expect(await packageTracker.isProducer(producer.address)).to.equal(false)
        })
    })

    xdescribe("setSuplier", async function () {
        it("reverted if called by not manager", async function () {
            expect(await packageTracker.isSuplier(suplier.address)).to.equal(false)
            await expect(
                packageTracker.connect(user).setSuplier(suplier.address)
            ).to.be.revertedWith("Caller is not the manager")
            expect(await packageTracker.isSuplier(suplier.address)).to.equal(false)
        })
        it("Suplier is setted correctly", async function () {
            await packageTracker.setManager(manager.address)
            expect(await packageTracker.isSuplier(suplier.address)).to.equal(false)
            await packageTracker.connect(manager).setSuplier(suplier.address)
            expect(await packageTracker.isSuplier(suplier.address)).to.equal(true)
        })
    })

    xdescribe("resetSuplier", async function () {
        beforeEach(async function () {
            await packageTracker.setManager(manager.address)
            await packageTracker.connect(manager).setSuplier(suplier.address)
        })

        it("reverted if called by not manager", async function () {
            expect(await packageTracker.isSuplier(suplier.address)).to.equal(true)
            await expect(
                packageTracker.connect(user).setSuplier(suplier.address)
            ).to.be.revertedWith("Caller is not the manager")
            expect(await packageTracker.isSuplier(suplier.address)).to.equal(true)
        })
        it("Suplier is setted correctly", async function () {
            expect(await packageTracker.isSuplier(suplier.address)).to.equal(true)
            await packageTracker.connect(manager).resetSuplier(suplier.address)
            expect(await packageTracker.isSuplier(suplier.address)).to.equal(false)
        })
    })

    describe("mintNft", async function () {
        beforeEach(async function () {
            await packageTracker.setManager(manager.address)
            await packageTracker.connect(manager).setSuplier(suplier.address)
            await packageTracker.connect(manager).setProducer(producer.address)
        })

        it("reverted if called by not producer", async function () {
            await expect(packageTracker.connect(user).mintNft(1)).to.be.revertedWith(
                "Caller is not the producer"
            )
        })
        it("producer can mint", async function () {
            await expect(packageTracker.connect(producer).mintNft(1)).to.emit(
                packageTracker,
                "TokenRequested"
            )
        })
    })
})
