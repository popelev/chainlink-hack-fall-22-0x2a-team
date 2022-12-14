const { network, ethers } = require("hardhat")
const { networkConfig } = require("../helper-hardhat-config")
require("dotenv").config()

const BASE_FEE = ethers.utils.parseEther("0.01").toHexString() // 0.25 LINK per request
const GAS_PRICE_LINK = 1e9
const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("100")
const TEST_IMAGE_URI = process.env.TEST_IMAGE_URI

async function main() {
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

    await packageTracker.setManager(manager.address)
    await packageTracker.connect(manager).setSuplier(suplier.address)

    await packageTracker.connect(manager).setProducer(producer.address)
    await packageTracker.connect(manager).setImageUriInList(1, TEST_IMAGE_URI)
    await packageTracker.connect(manager).setTitleInList(1, "Mystery Box")
    await packageTracker
        .connect(manager)
        .setDescriptionInList(
            1,
            "Every mystery box is different! It contains 3 random objects/gifts"
        )

    const transferTx = await packageTracker.connect(producer).mintNft(1)
    const result = await transferTx.wait(1)
    const id = result.events[1].args.requestId
    await vrgCoordinatorV2Mock.fulfillRandomWords(id, packageTracker.address)

    await packageTracker.connect(producer).setTokenDetails(1, 1, 1, 1)
    console.log(`Package Tracker contract deployed to ${packageTracker.address}`)
    console.log(`VRF contract deployed to ${vrgCoordinatorV2Mock.address}`)
    console.log(`First token details ${await packageTracker.getTokenDetails(1)}`)
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
