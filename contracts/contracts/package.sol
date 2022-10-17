// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error Package__Only();
error Package__TransferFaild();

contract Package is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
    /* Enums */
    enum TokenState {
        NOT_MINTED,
        MINTED,
        PRODUCED,
        IN_STOCK,
        SOLD
    }

    /* Structs */
    struct TokenDetails {
        TokenState state;
        uint256 uniqueId;
        uint256 titleId;
        uint256 descriptionId;
        uint256 imageUriId;
        uint256 producedTime;
        uint256 inStockTime;
        uint256 soldTime;
    }

    /* Manage contract */
    mapping(address => bool) private s_managers;
    mapping(address => bool) private s_producers;
    mapping(address => bool) private s_supliers;

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
    mapping(uint256 => string) public s_titles;
    mapping(uint256 => string) public s_descriptions;
    mapping(uint256 => uint256) public s_tokenUniqueIds;
    mapping(uint256 => TokenDetails) public s_tokenDetails;

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
    ) VRFConsumerBaseV2(vrfCoordinator) ERC721("QR-NFT Tracking", "QNFTT") {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinator);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
    }

    /* PUBLIC FUNCTIONS */
    function mintNft(uint32 countOfNft) public onlyOwner returns (uint256 requestId) {
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
            uint256 random = randomWords[i];
            s_tokenUniqueIds[random] = newTokenId;
            _safeMint(tokenOwner, newTokenId);
            s_tokenDetails[newTokenId].state = TokenState.MINTED;
            emit TokenMinted(newTokenId, random);
        }
        s_tokenCounter = newTokenId;
    }

    /* MANAGER SETTERS */
    function setImageUriInList(uint256 index, string calldata newImageUri) external onlyManager {
        string memory oldImageUri = s_imageUris[index];
        s_imageUris[index] = newImageUri;
        emit ImageUriListEdited(index, oldImageUri, newImageUri);
    }

    function setTitleInList(uint256 index, string calldata newTitle) external onlyManager {
        string memory oldTitle = s_titles[index];
        s_titles[index] = newTitle;
        emit TitleListEdited(index, oldTitle, newTitle);
    }

    function setDescriptionInList(uint256 index, string calldata newDescription)
        external
        onlyManager
    {
        string memory oldDescription = s_titles[index];
        s_descriptions[index] = newDescription;
        emit DescriptionListEdited(index, oldDescription, newDescription);
    }

    /* PRODUCER SETTERS */
    function setProductionTimestamp(uint256 index) external onlyProducer {
        require(s_tokenDetails[index].state == TokenState.MINTED, "Token not ready to produce");
        s_tokenDetails[index].state = TokenState.PRODUCED;
        uint256 timestamp = block.timestamp;
        s_tokenDetails[index].producedTime = timestamp;
        emit TokenPoduced(index, timestamp);
    }

    /* SUPLIER SETTERS */
    function setInStockTimestamp(uint256 index) external onlySuplier {
        require(
            s_tokenDetails[index].state == TokenState.PRODUCED,
            "Token not ready to move in stock"
        );
        s_tokenDetails[index].state = TokenState.IN_STOCK;
        uint256 timestamp = block.timestamp;
        s_tokenDetails[index].inStockTime = timestamp;
        emit TokenInStock(index, timestamp);
    }

    function setSoldTimestamp(uint256 index) external onlySuplier {
        TokenState tokenState = s_tokenDetails[index].state;
        require(
            tokenState == TokenState.PRODUCED || tokenState == TokenState.IN_STOCK,
            "Token not ready to sale"
        );
        uint256 timestamp = block.timestamp;
        if (tokenState == TokenState.PRODUCED) {
            s_tokenDetails[index].inStockTime = timestamp;
        }
        s_tokenDetails[index].state = TokenState.SOLD;
        s_tokenDetails[index].soldTime = timestamp;

        emit TokenSold(index, timestamp);
    }

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

    function getTokenNumberByUniqueId(uint256 id) public view returns (uint256) {
        return s_tokenUniqueIds[id];
    }

    function getTokenDetails(uint256 index) public view returns (TokenDetails memory) {
        return s_tokenDetails[index];
    }

    /* MODIFIERS */
    modifier onlyManager() {
        require(s_managers[msg.sender], "Caller is not the manager");
        _;
    }

    modifier onlyProducer() {
        require(s_producers[msg.sender], "Caller is not the producer");
        _;
    }

    modifier onlySuplier() {
        require(s_supliers[msg.sender], "Caller is not the suplier");

        _;
    }
}