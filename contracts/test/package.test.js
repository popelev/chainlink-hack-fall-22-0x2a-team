const { network, ethers } = require("hardhat")
const { expect } = require("chai")
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const { networkConfig } = require("../helper-hardhat-config")

const BASE_FEE = ethers.utils.parseEther("0.25").toHexString() // 0.25 LINK per request
const GAS_PRICE_LINK = 1e9
const DECIMALS = "18"
const INITIAL_PRICE = ethers.utils.parseUnits("2000", "ether")
const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("1")

const FIRST_TOKEN = 1

const NOT_MINTED = 0
const MINTED = 1
const PRODUCED = 2
const IN_STOCK = 3
const SOLD = 4

describe("Package", function () {
    let packageTracker, vrgCoordinatorV2Mock
    let owner, manager, producer, supplier, user
    let subscriptionId

    async function deployAll() {
        const [Owner, Manager, Producer, Supplier, User] = await ethers.getSigners()
        owner = Owner
        manager = Manager
        producer = Producer
        supplier = Supplier
        user = User
        const chainId = network.config.chainId

        const VrfCoordinatorV2Mock = await ethers.getContractFactory("VRFCoordinatorV2Mock")
        vrgCoordinatorV2Mock = await VrfCoordinatorV2Mock.deploy(BASE_FEE, GAS_PRICE_LINK, {
            value: 0,
        })
        const txResponse = await vrgCoordinatorV2Mock.createSubscription()
        const txReceipt = await txResponse.wait(1)
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
            supplier,
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

    describe("setManager", async function () {
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

    describe("resetManager", async function () {
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

    describe("setProducer", async function () {
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

    describe("resetProducer", async function () {
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

    describe("setSupplier", async function () {
        it("reverted if called by not manager", async function () {
            expect(await packageTracker.isSupplier(supplier.address)).to.equal(false)
            await expect(
                packageTracker.connect(user).setSupplier(supplier.address)
            ).to.be.revertedWith("Caller is not the manager")
            expect(await packageTracker.isSupplier(supplier.address)).to.equal(false)
        })
        it("Supplier is setted correctly", async function () {
            await packageTracker.setManager(manager.address)
            expect(await packageTracker.isSupplier(supplier.address)).to.equal(false)
            await packageTracker.connect(manager).setSupplier(supplier.address)
            expect(await packageTracker.isSupplier(supplier.address)).to.equal(true)
        })
    })

    describe("resetSupplier", async function () {
        beforeEach(async function () {
            await packageTracker.setManager(manager.address)
            await packageTracker.connect(manager).setSupplier(supplier.address)
        })

        it("reverted if called by not manager", async function () {
            expect(await packageTracker.isSupplier(supplier.address)).to.equal(true)
            await expect(
                packageTracker.connect(user).setSupplier(supplier.address)
            ).to.be.revertedWith("Caller is not the manager")
            expect(await packageTracker.isSupplier(supplier.address)).to.equal(true)
        })
        it("Supplier is setted correctly", async function () {
            expect(await packageTracker.isSupplier(supplier.address)).to.equal(true)
            await packageTracker.connect(manager).resetSupplier(supplier.address)
            expect(await packageTracker.isSupplier(supplier.address)).to.equal(false)
        })
    })
    describe("token", async function () {
        beforeEach(async function () {
            await packageTracker.setManager(manager.address)
            await packageTracker.connect(manager).setSupplier(supplier.address)
            await packageTracker.connect(manager).setProducer(producer.address)
        })
        describe("not minted token", async function () {
            it("token state not minted", async function () {
                const details = await packageTracker.getTokenDetails(FIRST_TOKEN)
                expect(details.state).to.equal(NOT_MINTED)
            })
        })

        describe("mintNft", async function () {
            it("reverted if called by not producer", async function () {
                await expect(packageTracker.connect(user).mintNft(1)).to.be.revertedWith(
                    "Caller is not the producer"
                )
            })
            it("producer can request mint", async function () {
                await expect(packageTracker.connect(producer).mintNft(1)).to.emit(
                    packageTracker,
                    "TokenRequested"
                )
            })
            it("packageTracker recieve random number and mint token", async function () {
                const transferTx = await packageTracker.connect(producer).mintNft(1)
                const result = await transferTx.wait(1)
                const id = result.events[1].args.requestId

                await expect(
                    vrgCoordinatorV2Mock.fulfillRandomWords(id, packageTracker.address)
                ).to.emit(packageTracker, "TokenMinted")

                const count = await packageTracker.getTokenCounter()
                expect(count.toNumber()).to.equal(1)
            })

            it("token state is minted", async function () {
                const transferTx = await packageTracker.connect(producer).mintNft(1)
                const result = await transferTx.wait(1)
                const id = result.events[1].args.requestId

                await expect(
                    vrgCoordinatorV2Mock.fulfillRandomWords(id, packageTracker.address)
                ).to.emit(packageTracker, "TokenMinted")

                const details = await packageTracker.getTokenDetails(FIRST_TOKEN)
                expect(details.state).to.equal(MINTED)
            })
        })

        describe("setProductionTimestamp", async function () {
            it("reverted if caller is not the producer", async function () {
                await expect(
                    packageTracker.connect(user).setProductionTimestamp(FIRST_TOKEN)
                ).to.be.revertedWith("Caller is not the producer")
            })
            it("reverted if token is not minted", async function () {
                await expect(
                    packageTracker.connect(producer).setProductionTimestamp(FIRST_TOKEN)
                ).to.be.revertedWith("Token not ready to produce")
            })
            it("production timestamp claimed", async function () {
                const transferTx = await packageTracker.connect(producer).mintNft(1)
                const result = await transferTx.wait(1)
                const id = result.events[1].args.requestId

                await expect(
                    vrgCoordinatorV2Mock.fulfillRandomWords(id, packageTracker.address)
                ).to.emit(packageTracker, "TokenMinted")

                await expect(
                    packageTracker.connect(producer).setProductionTimestamp(FIRST_TOKEN)
                ).to.emit(packageTracker, "TokenPoduced")
                const details = await packageTracker.getTokenDetails(FIRST_TOKEN)
                expect(details.state).to.equal(PRODUCED)
            })
        })
        describe("setInStockTimestamp", async function () {
            it("reverted if caller is not the supplier", async function () {
                await expect(
                    packageTracker.connect(user).setInStockTimestamp(FIRST_TOKEN)
                ).to.be.revertedWith("Caller is not the supplier")
            })
            it("reverted if token is not minted", async function () {
                await expect(
                    packageTracker.connect(supplier).setInStockTimestamp(FIRST_TOKEN)
                ).to.be.revertedWith("Token not ready to move in stock")
            })
            it("in stock timestamp claimed", async function () {
                const transferTx = await packageTracker.connect(producer).mintNft(1)
                const result = await transferTx.wait(1)
                const id = result.events[1].args.requestId

                await expect(
                    vrgCoordinatorV2Mock.fulfillRandomWords(id, packageTracker.address)
                ).to.emit(packageTracker, "TokenMinted")

                await expect(
                    packageTracker.connect(producer).setProductionTimestamp(FIRST_TOKEN)
                ).to.emit(packageTracker, "TokenPoduced")

                await expect(
                    packageTracker.connect(supplier).setInStockTimestamp(FIRST_TOKEN)
                ).to.emit(packageTracker, "TokenInStock")

                const details = await packageTracker.getTokenDetails(FIRST_TOKEN)
                expect(details.state).to.equal(IN_STOCK)
            })
        })

        describe("setSoldTimestamp", async function () {
            it("reverted if caller is not the supplier", async function () {
                await expect(
                    packageTracker.connect(user).setSoldTimestamp(FIRST_TOKEN)
                ).to.be.revertedWith("Caller is not the supplier")
            })
            it("reverted if token is not minted", async function () {
                await expect(
                    packageTracker.connect(supplier).setSoldTimestamp(FIRST_TOKEN)
                ).to.be.revertedWith("Token not ready to sale")
            })
            it("sold timestamp claimed after production", async function () {
                const transferTx = await packageTracker.connect(producer).mintNft(1)
                const result = await transferTx.wait(1)
                const id = result.events[1].args.requestId

                await expect(
                    vrgCoordinatorV2Mock.fulfillRandomWords(id, packageTracker.address)
                ).to.emit(packageTracker, "TokenMinted")

                await expect(
                    packageTracker.connect(producer).setProductionTimestamp(FIRST_TOKEN)
                ).to.emit(packageTracker, "TokenPoduced")

                await expect(packageTracker.connect(supplier).setSoldTimestamp(FIRST_TOKEN)).to.emit(
                    packageTracker,
                    "TokenSold"
                )

                const details = await packageTracker.getTokenDetails(FIRST_TOKEN)
                expect(details.state).to.equal(SOLD)
            })

            it("sold timestamp claimed after move in stock", async function () {
                const transferTx = await packageTracker.connect(producer).mintNft(1)
                const result = await transferTx.wait(1)
                const id = result.events[1].args.requestId

                await expect(
                    vrgCoordinatorV2Mock.fulfillRandomWords(id, packageTracker.address)
                ).to.emit(packageTracker, "TokenMinted")

                await expect(
                    packageTracker.connect(producer).setProductionTimestamp(FIRST_TOKEN)
                ).to.emit(packageTracker, "TokenPoduced")

                await expect(
                    packageTracker.connect(supplier).setInStockTimestamp(FIRST_TOKEN)
                ).to.emit(packageTracker, "TokenInStock")
                await expect(packageTracker.connect(supplier).setSoldTimestamp(FIRST_TOKEN)).to.emit(
                    packageTracker,
                    "TokenSold"
                )

                const details = await packageTracker.getTokenDetails(FIRST_TOKEN)
                expect(details.state).to.equal(SOLD)
            })
        })
    })
})
