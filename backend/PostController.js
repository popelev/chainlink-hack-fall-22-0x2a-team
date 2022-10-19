import ethers from "ethers";
import Package from "./contracts/PackageToken.json" assert { type: "json" };
import dotenv from "dotenv";
dotenv.config();

const INFURA_RPC_URL = process.env.INFURA_RPC_URL;
const OWNER_PK = process.env.OWNER_PK;
const MANAGER_PK = process.env.MANAGER_PK;
const PRODUCER_PK = process.env.PRODUCER_PK;
const SUPLIER_PK = process.env.SUPLIER_PK;
const USER_PK = process.env.USER_PK;
const PACKAGE_TRACKER_ADDRESS = process.env.PACKAGE_TRACKER_ADDRESS;

class Answer {
  constructor(answer) {
    this.answer = answer;
  }
}

class Postcontroller {
  async JsonParse(req, res) {
    try {
      // PREPARING
      const provider = new ethers.providers.JsonRpcProvider();
      ethers.Wallet.provider = provider;

      let ownerWallet = new ethers.Wallet(OWNER_PK, provider);
      let managerWallet = new ethers.Wallet(MANAGER_PK, provider);
      let producerWallet = new ethers.Wallet(PRODUCER_PK, provider);
      let suplierWallet = new ethers.Wallet(SUPLIER_PK, provider);
      let userWallet = new ethers.Wallet(USER_PK, provider);

      const TokenContract = new ethers.Contract(
        PACKAGE_TRACKER_ADDRESS,
        Package.abi,
        provider
      );

      let request = req.body;

      let answerBody = {
        answerId: request.id,
        qr: request.qr,
        success: false,
        imageLink: "",
        blockchainLink: "",
        name: "Not Found",
        produced: false,
        producedDate: "",
        inShop: false,
        inShopDate: "",
        Sold: false,
        soldDate: "",
      };

      // LOGIC
      //const ContractByOwner = TokenContract.connect(ownerWallet);
      //const ContractByManager = TokenContract.connect(managerWallet);

      const ContractByUser = TokenContract.connect(userWallet);
      let tokenId = await ContractByUser.getTokenNumberByUniqueId(request.qr);
      let scanAnswer;

      if (request.type == "scan") {
        scanAnswer = await ContractByUser.getTokenDetails(tokenId);
      } else if (request.account == "producer") {
        const ContractByProducer = TokenContract.connect(producerWallet);
        if (request.type == "produce") {
          const tx = await ContractByProducer.setProductionTimestamp(tokenId);
          //await tx.wait();
          scanAnswer = await ContractByProducer.getTokenDetails(tokenId);
        }
      } else if (request.account == "suplier") {
        const ContractBySuplier = TokenContract.connect(suplierWallet);
        if (request.type == "inshop") {
          const tx = await ContractBySuplier.setInStockTimestamp(tokenId);
          //await tx.wait();
        } else if (request.type == "sale") {
          const tx = await ContractBySuplier.setSoldTimestamp(tokenId);
          //await tx.wait();
        }
        scanAnswer = await ContractBySuplier.getTokenDetails(tokenId);
      }

      let success = scanAnswer.state > 0;
      if (success) {
        answerBody.success = success;
        answerBody.produced = scanAnswer.state >= 2;
        answerBody.inShop = scanAnswer.state >= 3;
        answerBody.Sold = scanAnswer.state >= 4;
      }

      // ANSWER
      let answer = new Answer(answerBody);
      res.status(200).json(answer);
    } catch (e) {
      console.log(e);
    }
  }
}

export default new Postcontroller();
