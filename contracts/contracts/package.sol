// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error Package__TransferFaild();

contract Package is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
    /* Enums */
    enum State {
        MINTED,
        PRODUCED,
        IN_STOCK,
        SOLD
    }

    /* Structs */
    struct TokenDetails {
        State state;
        uint256 uniqueId;
        uint256 titleId;
        uint256 descriptionId;
        uint256 imageUriId;
        uint256 producedTime;
        uint256 inStockTime;
        uint256 soldTime;
    }

    /* Manager contract */
    address private s_managerContract;

    /* Chainlink VRF varibles */
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATION = 1;

    /* VRF Helper */
    mapping(uint256 => address) public s_requestIdSender;

    /* NFT varible */
    uint256 public s_tokenCounter;
    mapping(uint256 => string) public s_imageUris;
    mapping(uint256 => TokenDetails) public s_tokenDetails;
    mapping(uint256 => string) public s_titles;
    mapping(uint256 => string) public s_descriptions;

    /* Token state Events */
    event TokenRequested(uint256 indexed requestId, address requester);
    event TokenMinted(uint256 requestId, uint256 randomNumber);
    event TokenPoduced(uint256 tokenId, uint256 time);
    event TokenInStock(uint256 tokenId, uint256 time);
    event TokenSold(uint256 tokenId, uint256 time);

    /* Token description Events */
    event TitleListEdited(uint256 indexed id, string oldString, string newString);
    event DescriptionListEdited(uint256 indexed id, string oldString, string newString);
    event ImageUriListEdited(uint256 indexed id, string oldString, string newString);

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
    function mintNft(uint32 countOfNft) public payable onlyOwner returns (uint256 requestId) {
        require(countOfNft < 500);
        requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATION,
            i_callbackGasLimit,
            countOfNft
        );
        s_requestIdSender[requestId] = msg.sender;
        emit TokenRequested(requestId, msg.sender);
    }

    /* INTERNAL */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address tokenOwner = s_requestIdSender[requestId];
        uint256 newTokenId = s_tokenCounter;
        for (uint256 i = 0; i < randomWords.length; i++) {
            newTokenId += newTokenId;
            uint256 random = randomWords[0];
            _safeMint(tokenOwner, newTokenId);
            emit TokenMinted(requestId, random);
        }
        s_tokenCounter = newTokenId;
    }

    /* SETTERS */
    function setName() public {}

    /* GETTERS */

    function getGasLane() public view returns (bytes32) {
        return i_gasLane;
    }

    function getTokenURI(uint256 index) public view returns (string memory) {
        uint256 imageUriId = s_tokenDetails[index].imageUriId;
        return s_imageUris[imageUriId];
    }

    function getVrfCoordinatorAddress() public view returns (address) {
        return address(i_vrfCoordinator);
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

    function getTokenDetails(uint256 index) public view returns (TokenDetails memory) {
        return s_tokenDetails[index];
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
