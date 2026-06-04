// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract AcademicCredential is ERC721URIStorage {
    address public admin;
    uint256 private _nextTokenId;

     struct Institution {
        string name;
        string accreditation;
        string email;
        address wallet;
        bool isRegistered;
        uint256 registeredAt;
    }

    struct Student {
        string fullName;
        string studentId;
        string major;
        uint256 enrollmentYear;
        address wallet;
        bool exists;
    }

    struct Credential {
        uint256 tokenId;
        string credentialType;     // Diploma, Certificate, Transcript
        string title;              // Bachelor of Computer Science
        string grade;              // GPA / Grade
        uint256 issueDate;
        address institution;
        address student;
        bool revoked;
    }

    // MAPPINGS & DATA STORAGE
    mapping(address => Institution) public institutions;
    mapping(address => Student) public students;
    mapping(uint256 => Credential) public credentials;
    mapping(address => uint256[]) private studentCredentials;

    // EVENTS
    event InstitutionAdded(address indexed institution, string name);
    event InstitutionRemoved(address indexed institution);
    event StudentRegistered(address indexed student, string fullName, string studentId);
    event CredentialIssued(uint256 indexed tokenId, address indexed student, string credentialType, string title);
    event CredentialRevoked(uint256 indexed tokenId);

    // MODIFIERS
    modifier onlyAdmin() {
        require(msg.sender == admin, "Akses ditolak: Hanya untuk Admin");
        _;
    }

    modifier onlyInstitution() {
        // Pengecekan hak akses dialihkan ke status isRegistered di dalam struct Institution
        require(institutions[msg.sender].isRegistered, "Akses ditolak: Bukan institusi pendidikan terdaftar");
        _;
    }

    constructor() ERC721("AcademicCredentialSBT", "ACSBT") {
        admin = msg.sender; 
    }

    // =====================================================
    // FUNCTIONS
    // =====================================================

    // 1. Menambahkan alamat universitas dan mengisi data profil lengkapnya [cite: 33, 50]
    function addInstitution(
        address _institution, 
        string calldata _name,
        string calldata _accreditation,
        string calldata _email
    ) external onlyAdmin {
        institutions[_institution] = Institution({
            name: _name,
            accreditation: _accreditation,
            email: _email,
            wallet: _institution,
            isRegistered: true,
            registeredAt: block.timestamp
        });
        emit InstitutionAdded(_institution, _name);
    }


    // 2. Mencabut hak akses universitas [cite: 51, 52]
    function removeInstitution(address _institution) external onlyAdmin {
        institutions[_institution].isRegistered = false;
        emit InstitutionRemoved(_institution);
    }

    function registerStudent(
        address _student,
        string calldata _fullName,
        string calldata _studentId,
        string calldata _major,
        uint256 _enrollmentYear
    ) external onlyInstitution {
        students[_student] = Student({
            fullName: _fullName,
            studentId: _studentId,
            major: _major,
            enrollmentYear: _enrollmentYear,
            wallet: _student,
            exists: true
        });
        emit StudentRegistered(_student, _fullName, _studentId);
    }

    // 3. Menerbitkan SBT ke wallet mahasiswa sekaligus mencatat metadata akademiknya 
    function issueCredential(
        address _student, 
        string calldata _credentialType,
        string calldata _title,
        string calldata _grade,
        string calldata _tokenURI
    ) external onlyInstitution {
        // Jika mahasiswa belum sempat didaftarkan via registerStudent, buat data fallback dasar
        if (!students[_student].exists) {
            students[_student].wallet = _student;
            students[_student].exists = true;
        }

        uint256 tokenId = _nextTokenId++;
        _mint(_student, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        
        // Mengisi data ke dalam struct Credential
        credentials[tokenId] = Credential({
            tokenId: tokenId,
            credentialType: _credentialType,
            title: _title,
            grade: _grade,
            issueDate: block.timestamp,
            institution: msg.sender,
            student: _student,
            revoked: false
        });

        studentCredentials[_student].push(tokenId);
        
        emit CredentialIssued(tokenId, _student, _credentialType, _title);
    }

    // 4. Membatalkan/menarik ijazah dengan mengubah status revoked di dalam struct 
    function revokeCredential(uint256 _tokenId) external onlyInstitution {
        require(_ownerOf(_tokenId) != address(0), "Ijazah tidak ditemukan");
        // Memastikan hanya universitas yang menerbitkannya yang boleh membatalkannya
        require(credentials[_tokenId].institution == msg.sender, "Akses ditolak: Bukan penerbit ijazah ini");
        
        credentials[_tokenId].revoked = true;
        
        emit CredentialRevoked(_tokenId);
    }

    // 5. Fungsi view untuk mengecek status validasi ijazah 
    function isValidCredential(uint256 _tokenId) external view returns (bool) {
        return _ownerOf(_tokenId) != address(0) && !credentials[_tokenId].revoked;
    }

    // 6. Fungsi view untuk mendapatkan daftar ID ijazah yang dimiliki mahasiswa 
    function getStudentCredential(address _student) external view returns (uint256[] memory) {
        return studentCredentials[_student];
    }

    // Mengambil data objek Credential utuh untuk kebutuhan read Frontend/Verifikator
    function getCredentialDetails(uint256 _tokenId) external view returns (Credential memory) {
        require(_ownerOf(_tokenId) != address(0), "Ijazah tidak ditemukan");
        return credentials[_tokenId];
    }

    // 7. SOULBOUND TOKEN (SBT) LOGIC (Memblokir fitur transfer) 
    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        
        if (from != address(0) && to != address(0)) {
            revert("Soulbound Token: Ijazah tidak dapat dipindahtangankan");
        }
        
        return super._update(to, tokenId, auth);
    }
}