// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error Package__TransferFaild();

contract Package is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
    /* Structs */
    struct TokenState {
        bool IsAnnounced;
        bool IsProduced;
        uint256 ProducedTime;
        bool IsInStock;
        uint256 InStockTime;
        bool IsSold;
        uint256 SoldTime;
    }

    /* Enums */
    enum State {
        ANNOUNCED,
        PRODUCED,
        IN_STOCK,
        SOLD
    }
    /* Manager contract */
    address private s_managerContract;

    /* Chainlink VRF varibles */
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint32 private constant NUM_WORDS = 1;
    uint16 private constant REQUEST_CONFIRMATION = 1;

    /* VRF Helper */
    mapping(uint256 => address) public s_requestIdSender;

    /* NFT varible */
    uint256 public s_tokenCounter;
    uint256 internal constant MAX_CHANCE_VALUE = 100;
    string[] internal s_tokenUris;
    mapping(uint256 => State) public s_tokenState;
    mapping(uint256 => uint256) public s_tokenProducedTime;
    mapping(uint256 => uint256) public s_tokenInStockTime;
    mapping(uint256 => uint256) public s_tokenSoldTime;

    /* Events */
    event TokenRequested(uint256 indexed requestId, address requester);
    event TokenMinted(uint256 requestId, address minter);

    /* CONSTRUCTOR */
    constructor(
        address vrfCoordinator,
        uint64 subscriptionId,
        bytes32 gasLane,
        uint32 callbackGasLimit
    ) VRFConsumerBaseV2(vrfCoordinator) ERC721("Random IPFS NFT", "RIN") {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinator);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
    }

    /* PUBLIC FUNCTIONS */
    function mintNft() public payable onlyOwner returns (uint256 requestId) {
        requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATION,
            i_callbackGasLimit,
            NUM_WORDS
        );
        s_requestIdSender[requestId] = msg.sender;
        emit TokenRequested(requestId, msg.sender);
    }

    /* INTERNAL */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address tokenOwner = s_requestIdSender[requestId];
        uint256 newTokenId = s_tokenCounter;

        s_tokenCounter += s_tokenCounter;
        _safeMint(tokenOwner, newTokenId);
        //_setTokenURI(newTokenId, s_dogTokenUris[uint256(dogBreed)]);
        //emit TokenMinted(dogBreed, tokenOwner);
    }

    /* GETTERS */

    function getGasLane() public view returns (bytes32) {
        return i_gasLane;
    }

    function tokenURI(uint256 index) public view override returns (string memory) {
        return s_tokenUris[index];
    }

    function getVrfCoordinatorAddress() public view returns (address) {
        return address(i_vrfCoordinator);
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

    function getMaxChance() public pure returns (uint256) {
        return MAX_CHANCE_VALUE;
    }

    function getTokenState(uint256 index) public view returns (TokenState memory tokenState) {
        tokenState.IsAnnounced = s_tokenState[index] <= State.ANNOUNCED;
        tokenState.IsProduced = s_tokenState[index] <= State.PRODUCED;
        tokenState.ProducedTime;
        tokenState.IsInStock = s_tokenState[index] <= State.IN_STOCK;
        tokenState.InStockTime;
        tokenState.IsSold = s_tokenState[index] <= State.SOLD;
        tokenState.SoldTime;
    }

    /* MODIFIERS */
    modifier onlyProducer() {
        if (msg.sender < address(0)) {
            revert();
        }
        _;
    }

    modifier onlySuplier() {
        if (msg.sender < address(0)) {
            revert();
        }
        _;
    }
}
