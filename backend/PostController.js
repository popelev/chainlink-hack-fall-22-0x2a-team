import { ethers, BigNumber } from "ethers";

import Package from "./contracts/PackageToken.json" assert { type: "json" };
import VRFCoordinatorV2Mock from "./contracts/VRFCoordinatorV2Mock.json" assert { type: "json" };

import dotenv from "dotenv";
dotenv.config();

const INFURA_RPC_URL = process.env.INFURA_RPC_URL;
const OWNER_PK = process.env.OWNER_PK;
const MANAGER_PK = process.env.MANAGER_PK;
const PRODUCER_PK = process.env.PRODUCER_PK;
const SUPLIER_PK = process.env.SUPLIER_PK;
const USER_PK = process.env.USER_PK;
const PACKAGE_TRACKER_ADDRESS = process.env.PACKAGE_TRACKER_ADDRESS;
const VRF_ADDRESS = process.env.VRF_ADDRESS;

const NOT_MINTED = 0;
const MINTED = 1;
const PRODUCED = 2;
const IN_STOCK = 3;
const SOLD = 4;

class Answer {
  constructor(answer) {
    this.answer = answer;
  }
}

class Postcontroller {
  async JsonParse(req, res) {
    let request = req.body;

    let answerBody = {
      answerId: request.id,
      qr: request.qr,
      account: "user",
      success: false,
      imageLink: "",
      blockchainLink: "",
      name: "",
      description: "",
      produced: false,
      producedDate: "",
      inShop: false,
      inShopDate: "",
      sold: false,
      soldDate: "",
      buttonTitle: "",
      buttonEnable: false,
    };
    let scanAnswer;

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

      const VRFConsumerBase = new ethers.Contract(
        VRF_ADDRESS,
        VRFCoordinatorV2Mock.abi,
        provider
      );

      // LOGIC
      //const ContractByOwner = TokenContract.connect(ownerWallet);
      //const ContractByManager = TokenContract.connect(managerWallet);

      const ContractByUser = TokenContract.connect(userWallet);
      let tokenId = await ContractByUser.getTokenNumberByUniqueId(request.qr);

      if (request.account == "producer") {
        const ContractByProducer = TokenContract.connect(producerWallet);
        const vrgCoordinatorV2Mock = VRFConsumerBase.connect(ownerWallet);
        if (request.type == "mint") {
          const transferTx = await ContractByProducer.mintNft(1);
          const result = await transferTx.wait(1);
          const id = result.events[1].args.requestId;
          await vrgCoordinatorV2Mock.fulfillRandomWords(
            id,
            TokenContract.address
          );
          const count = await ContractByProducer.getTokenCounter();
          scanAnswer = await ContractByProducer.getTokenDetails(count);
        } else if (request.type == "produce") {
          await ContractByProducer.setProductionTimestamp(tokenId);
          scanAnswer = await ContractByProducer.getTokenDetails(tokenId);
        } else {
          scanAnswer = await ContractByProducer.getTokenDetails(tokenId);
        }
      } else if (request.account == "suplier") {
        const ContractBySuplier = TokenContract.connect(suplierWallet);
        if (request.type == "inshop") {
          await ContractBySuplier.setInStockTimestamp(tokenId);
          scanAnswer = await ContractBySuplier.getTokenDetails(tokenId);
        } else if (request.type == "sale") {
          await ContractBySuplier.setSoldTimestamp(tokenId);
          scanAnswer = await ContractBySuplier.getTokenDetails(tokenId);
        } else {
          scanAnswer = await ContractBySuplier.getTokenDetails(tokenId);
        }
      } else {
        scanAnswer = await ContractByUser.getTokenDetails(tokenId);
      }

      // Date and Time
      let success = scanAnswer.state > NOT_MINTED;
      if (success) {
        answerBody.qr = scanAnswer.uniqueId.toString();
        answerBody.name = await ContractByUser.getTitle(scanAnswer.titleId);
        answerBody.description = await ContractByUser.getDescription(
          scanAnswer.descriptionId
        );
        answerBody.imageLink = await ContractByUser.getImageURI(
          scanAnswer.imageUriId
        );

        answerBody.success = success;
        answerBody.produced = scanAnswer.state >= PRODUCED;
        if (answerBody.produced) {
          answerBody.producedDate = new Date(scanAnswer.producedTime * 1000)
            .toISOString()
            .split(".")[0]
            .replace("T", " ");
          answerBody.buttonTitle = "Produced";
          answerBody.buttonEnable = false;
        }
        answerBody.inShop = scanAnswer.state >= IN_STOCK;
        if (answerBody.inShop) {
          answerBody.inShopDate = new Date(scanAnswer.inStockTime * 1000)
            .toISOString()
            .split(".")[0]
            .replace("T", " ");
          answerBody.buttonTitle = "In Stock";
          answerBody.buttonEnable = false;
        }

        answerBody.sold = scanAnswer.state >= SOLD;
        if (answerBody.sold) {
          answerBody.soldDate = new Date(scanAnswer.soldTime * 1000)
            .toISOString()
            .split(".")[0]
            .replace("T", " ");
          answerBody.buttonTitle = "Sold";
          answerBody.buttonEnable = false;
        }

        // Button
        answerBody.account = request.account;

        if (answerBody.account == "producer") {
          if (scanAnswer.state < MINTED) {
            answerBody.buttonTitle = "Not minted";
            answerBody.buttonEnable = false;
          } else if (scanAnswer.state == MINTED) {
            answerBody.buttonTitle = "Produce";
            answerBody.buttonEnable = true;
          } else {
            answerBody.buttonTitle = "Produced";
            answerBody.buttonEnable = false;
          }
        } else if (answerBody.account == "suplier") {
          if (scanAnswer.state < PRODUCED) {
            answerBody.buttonTitle = "Not produced";
            answerBody.buttonEnable = false;
          } else if (scanAnswer.state == PRODUCED) {
            answerBody.buttonTitle = "In Stock";
            answerBody.buttonEnable = true;
          } else if (scanAnswer.state == IN_STOCK) {
            answerBody.buttonTitle = "Sale";
            answerBody.buttonEnable = true;
          } else {
            answerBody.buttonTitle = "Sold";
            answerBody.buttonEnable = false;
          }
        }
      } else {
        answerBody.name = "Not Found";
        answerBody.buttonTitle = "Not Found";
        answerBody.buttonEnable = false;
      }

      // ANSWER
    } catch (e) {
      console.log(e);
      answerBody.problem = e;
    }
    res.status(200).json(new Answer(answerBody));
  }
}

export default new Postcontroller();
