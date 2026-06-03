// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract AcademicCredential is ERC721URIStorage {
    address public admin;
    uint256 private _nextTokenId;

    mapping(address => bool) public institutions;
    mapping(uint256 => bool) public isRevoked;
    mapping(address => uint256[]) private studentCredentials;

    event InstitutionAdded(address indexed institution, string name);
    event CredentialIssued(uint256 indexed tokenId, address indexed student, string tokenURI);
    event CredentialRevoked(uint256 indexed tokenId);

    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Akses ditolak: Hanya untuk Admin");
        _;
    }

    modifier onlyInstitution() {
        require(institutions[msg.sender], "Akses ditolak: Bukan institusi pendidikan terdaftar");
        _;
    }

    constructor() ERC721("AcademicCredentialSBT", "ACSBT") {
        admin = msg.sender; // Deployer otomatis menjadi Admin
    }

    // 1. Menambahkan alamat universitas yang berhak menerbitkan ijazah
    function addInstitution(address _institution, string calldata _name) external onlyAdmin {
        institutions[_institution] = true;
        emit InstitutionAdded(_institution, _name);
    }

    // 2. Mencabut hak akses universitas
    function removeInstitution(address _institution) external onlyAdmin {
        institutions[_institution] = false;
    }

    // 3. Menerbitkan SBT ke wallet mahasiswa
    function issueCredential(address _student, string calldata _tokenURI) external onlyInstitution {
        uint256 tokenId = _nextTokenId++;
        _mint(_student, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        
        studentCredentials[_student].push(tokenId);
        
        emit CredentialIssued(tokenId, _student, _tokenURI);
    }

    // 4. Membatalkan/menarik ijazah yang sudah terbit jika ada kesalahan fatal
    function revokeCredential(uint256 _tokenId) external onlyInstitution {
        require(_ownerOf(_tokenId) != address(0), "Ijazah tidak ditemukan");
        isRevoked[_tokenId] = true;
        
        emit CredentialRevoked(_tokenId);
    }

    // 5. Fungsi view untuk mengecek status validasi ijazah
    function isValidCredential(uint256 _tokenId) external view returns (bool) {
        return _ownerOf(_tokenId) != address(0) && !isRevoked[_tokenId];
    }

    // 6. Fungsi view untuk mendapatkan daftar ID ijazah yang dimiliki mahasiswa
    function getStudentCredential(address _student) external view returns (uint256[] memory) {
        return studentCredentials[_student];
    }

    // 7. SOULBOUND TOKEN (SBT) LOGIC 
    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Memastikan token hanya bisa diciptakan (mint) atau dihancurkan (burn), BUKAN ditransfer antar akun
        if (from != address(0) && to != address(0)) {
            revert("Soulbound Token: Ijazah tidak dapat dipindahtangankan");
        }
        
        return super._update(to, tokenId, auth);
    }
}