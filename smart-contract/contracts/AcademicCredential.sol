// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./ERC721.sol";

contract AcademicCredential is ERC721 {
    uint256 private _nextTokenId;
    
    // Variabel untuk menyimpan alamat wallet Universitas (Owner)
    address public owner;

    // Mapping Token ID => Link Metadata IPFS Ijazah
    mapping(uint256 => string) private _tokenURIs;

    event CertificateIssued(address indexed student, uint256 indexed tokenId, string tokenURI);

    // MODIFIER MANUAL: Menggantikan peran 'onlyOwner' dari OpenZeppelin
    modifier onlyOwner() {
        require(msg.sender == owner, "SBT Error: Hanya Universitas yang memiliki akses!");
        _;
    }

    // Constructor mengirimkan nama & simbol ke ERC721.sol, dan mencatat siapa owner-nya
    constructor() ERC721("EduVerify Academic Certificate", "EDUSBT") {
        owner = msg.sender; // msg.sender saat deploy otomatis menjadi owner (Universitas)
    }

    // Fungsi mencetak ijazah, diamankan dengan modifier onlyOwner buatan sendiri
    function issueCertificate(address student, string memory ipfsURI) external onlyOwner returns (uint256) {
        require(student != address(0), "SBT Error: Alamat mahasiswa tidak valid");
        
        uint256 tokenId = _nextTokenId++;
        
        // Panggil fungsi pembukuan internal dari ERC721.sol
        _update(student, tokenId);
        
        _tokenURIs[tokenId] = ipfsURI;

        emit CertificateIssued(student, tokenId, ipfsURI);
        return tokenId;
    }

    function tokenURI(uint256 tokenId) public view returns (string memory) {
        require(_owners[tokenId] != address(0), "SBT Error: Kredensial tidak ditemukan");
        return _tokenURIs[tokenId];
    }

    // LOGIKA SOULBOUND (Tetap sama, mengunci transfer)
    function _update(address to, uint256 tokenId) internal override {
        address from = _owners[tokenId];

        if (from != address(0)) {
            revert("SBT Error: Token ini bersifat Soulbound. Kredensial tidak dapat ditransfer!");
        }

        super._update(to, tokenId);
    }
}
