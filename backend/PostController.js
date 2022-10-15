import ethers from "ethers";
import erc20 from "./contracts/ERC20.json" assert { type: "json" };

const ownerPrivateKey =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const producerPrivateKey =
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

const contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";

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
      let owner = new ethers.Wallet(ownerPrivateKey, provider);
      let producer = new ethers.Wallet(producerPrivateKey, provider);

      const ERC20 = new ethers.Contract(contractAddress, erc20.abi, provider);

      const ERC20ByOwner = ERC20.connect(owner);
      const ERC20ByProducer = ERC20.connect(producer);

      // LOGIC
      let answerBody = "not found";
      let request = req.body;

      if (request.account == "producer") {
      } else if (request.account == "suplier") {
        answerBody = "suplier";
      } else if (request.account == "customer") {
        answerBody = "customer";
      }
      answerBody = {
        answerId: request.id,
        qr: request.qr,
        success: true,
        imageLink:
          "https://www.mordovmedia.ru/media/news/36/45636/fee13cffeffe19bc38cd022936c2269e.jpg",
        blockchainLink:
          "https://etherscan.io/tx/0xe6bbaac50d546499c43e0fd613277949ac66c1f02d3c58bd26a61dd8598113cd",
        name: "Box with something awesome",
        produced: true,
        producedDate: "01.01.23 09:00",
        inShop: true,
        inShopDate: "02.01.23 09:00",
        Sold: true,
        soldDate: "03.01.23 09:00",
      };
      // ANSWER
      let answer = new Answer(answerBody);
      res.status(200).json(answer);
    } catch (e) {
      console.log(e);
    }
  }
}

export default new Postcontroller();
