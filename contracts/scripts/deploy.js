const { network, ether } = require("hardhat")

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
    await packageTracker.connect(producer).mintNft(1)

    console.log(`Ruble ERC20 contract deployed to ${ruble.address}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
