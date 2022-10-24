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
    uint256 private s_tokenCounter = 0;
    mapping(uint256 => string) private s_imageUris;
    mapping(uint256 => string) private s_titles;
    mapping(uint256 => string) private s_descriptions;
    mapping(uint256 => uint256) private s_tokenUniqueIds;
    mapping(uint256 => TokenDetails) private s_tokenDetails;

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
    // function mintNft() external returns (uint256 requestId) {
    //     requestId = mintNft(1);
    // }

    function mintNft(uint32 countOfNft) external onlyProducer returns (uint256 requestId) {
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
            newTokenId = newTokenId + 1;
            uint256 random = randomWords[i];
            s_tokenUniqueIds[random] = newTokenId;
            _safeMint(tokenOwner, newTokenId);
            s_tokenDetails[newTokenId].state = TokenState.MINTED;
            s_tokenDetails[newTokenId].uniqueId = random;

            emit TokenMinted(newTokenId, random);
        }
        s_tokenCounter = newTokenId;
    }

    /* OWNER SETTERS */
    function setManager(address manager) external onlyOwner {
        s_managers[manager] = true;
    }

    function resetManager(address manager) external onlyOwner {
        s_managers[manager] = false;
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

    function setProducer(address producer) external onlyManager {
        s_producers[producer] = true;
    }

    function resetProducer(address producer) external onlyManager {
        s_producers[producer] = false;
    }

    function setSuplier(address suplier) external onlyManager {
        s_supliers[suplier] = true;
    }

    function resetSuplier(address suplier) external onlyManager {
        s_supliers[suplier] = false;
    }

    /* PRODUCER SETTERS */
    function setProductionTimestamp(uint256 index) external onlyProducer {
        require(s_tokenDetails[index].state == TokenState.MINTED, "Token not ready to produce");
        s_tokenDetails[index].state = TokenState.PRODUCED;
        uint256 timestamp = block.timestamp;
        s_tokenDetails[index].producedTime = timestamp;
        emit TokenPoduced(index, timestamp);
    }

    function setTokenImageUri(uint256 tokenIndex, uint256 imageUriId) external onlyProducer {
        s_tokenDetails[tokenIndex].imageUriId = imageUriId;
    }

    function setTokenTitle(uint256 tokenIndex, uint256 titleId) external onlyProducer {
        s_tokenDetails[tokenIndex].titleId = titleId;
    }

    function setTokenDescription(uint256 tokenIndex, uint256 descriptionId) external onlyProducer {
        s_tokenDetails[tokenIndex].descriptionId = descriptionId;
    }

    function setTokenDetails(
        uint256 tokenIndex,
        uint256 imageUriId,
        uint256 titleId,
        uint256 descriptionId
    ) external onlyProducer {
        s_tokenDetails[tokenIndex].imageUriId = imageUriId;
        s_tokenDetails[tokenIndex].titleId = titleId;
        s_tokenDetails[tokenIndex].descriptionId = descriptionId;
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

    function getImageURI(uint256 index) public view returns (string memory) {
        return s_imageUris[index];
    }

    function getTitle(uint256 index) public view returns (string memory) {
        return s_titles[index];
    }

    function getDescription(uint256 index) public view returns (string memory) {
        return s_descriptions[index];
    }

    function getVrfCoordinatorAddress() public view returns (address) {
        return address(i_vrfCoordinator);
    }

    function getVrfCoordinatorSubId() public view returns (uint64) {
        return i_subscriptionId;
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

    function getTokenNumberByUniqueId(uint256 id) public view returns (uint256) {
        return s_tokenUniqueIds[id];
    }

    function getTokenDetailsByUniqueId(uint256 id) public view returns (TokenDetails memory) {
        return s_tokenDetails[s_tokenUniqueIds[id]];
    }

    function getTokenDetails(uint256 index) public view returns (TokenDetails memory) {
        return s_tokenDetails[index];
    }

    function isManager(address manager) public view returns (bool) {
        return s_managers[manager];
    }

    function isProducer(address producer) public view returns (bool) {
        return s_producers[producer];
    }

    function isSuplier(address suplier) public view returns (bool) {
        return s_supliers[suplier];
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
