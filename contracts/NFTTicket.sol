// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTTicket is ERC721, Ownable {
    uint256 private _nextTokenId;

    // tokenId => event name
    mapping(uint256 => string) public ticketEvent;
    // tokenId => check-in hash (keccak256 of secret + tokenId, set at mint)
    mapping(uint256 => bytes32) public ticketHash;
    // tokenId => used
    mapping(uint256 => bool) public ticketUsed;

    event TicketMinted(address indexed to, uint256 indexed tokenId, string eventName, bytes32 checkInHash);
    event TicketCheckedIn(uint256 indexed tokenId);

    constructor() ERC721("NFTTicket", "TKXT") Ownable(msg.sender) {}

    /// @notice Mint a ticket NFT to `to` for `eventName`.
    /// @param checkInHash A bytes32 hash the owner pre-computes off-chain (e.g. keccak256(secret, tokenId)).
    function mint(address to, string calldata eventName, bytes32 checkInHash) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        ticketEvent[tokenId] = eventName;
        ticketHash[tokenId] = checkInHash;
        ticketUsed[tokenId] = false;
        emit TicketMinted(to, tokenId, eventName, checkInHash);
        return tokenId;
    }

    /// @notice Check in a ticket by providing the matching hash. Only owner can call.
    function checkIn(uint256 tokenId, bytes32 providedHash) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(!ticketUsed[tokenId], "Ticket already used");
        require(ticketHash[tokenId] == providedHash, "Invalid check-in hash");
        ticketUsed[tokenId] = true;
        emit TicketCheckedIn(tokenId);
    }

    /// @notice Returns ticket info.
    function getTicket(uint256 tokenId) external view returns (
        address owner,
        string memory eventName,
        bytes32 checkInHash,
        bool used
    ) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return (
            ownerOf(tokenId),
            ticketEvent[tokenId],
            ticketHash[tokenId],
            ticketUsed[tokenId]
        );
    }

    /// @notice Returns total tickets minted so far.
    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }
}
