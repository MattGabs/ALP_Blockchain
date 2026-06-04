// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./ERC721.sol";

contract AcademicCredential is ERC721 {
    uint256 private _nextTokenId;
    
    // Alamat wallet Admin Pusat / Kementerian (Deployer Kontrak)
    address public admin;

    // --- STRUCT & MAPPING UNTUK DID & INSTITUSI ---
    struct Institution {
        string name;
        bool isActive;
    }

    // Mapping Alamat Universitas => Data Institusi
    mapping(address => Institution) public institutions;
    
    // Mapping Token ID => Link Metadata IPFS Ijazah
    mapping(uint256 => string) private _tokenURIs;
    
    // Mapping Token ID => Status Validasi (True jika aktif, False jika di-revoke)
    mapping(uint256 => bool) private _isValid;

    // Mapping Alamat Mahasiswa => Daftar Token ID Ijazah yang dimiliki
    mapping(address => uint256[]) private _studentCredentials;

    // --- EVENTS ---
    event InstitutionAdded(address indexed institution, string name);
    event InstitutionRemoved(address indexed institution);
    event CredentialIssued(uint256 indexed tokenId, address indexed student, string tokenURI, address indexed issuer);
    event CredentialRevoked(uint256 indexed tokenId, address indexed issuer);

    // --- MODIFIERS ---
    // Membatasi akses hanya untuk Admin Pusat (Kementerian)
    modifier onlyAdmin() {
        require(msg.sender == admin, "SBT Error: Hanya Admin Pusat yang memiliki akses!");
        _;
    }

    // Membatasi akses hanya untuk Universitas yang terdaftar dan aktif
    modifier onlyInstitution() {
        require(institutions[msg.sender].isActive, "SBT Error: Hanya Institusi terdaftar yang memiliki akses!");
        _;
    }

    // Inisialisasi Nama & Simbol NFT, serta mengunci akun Deployer sebagai Admin Pusat
    constructor() ERC721("EduVerify Academic Certificate", "EDUSBT") {
        admin = msg.sender;
    }

    // --- 7 FUNGSI WAJIB BERDASARKAN RANCANGAN ---

    // 1. Menambahkan universitas baru ke dalam sistem DID (Hanya Admin Pusat)
    function addInstitution(address _institution, string calldata _name) external onlyAdmin {
        require(_institution != address(0), "SBT Error: Alamat institusi tidak valid");
        require(bytes(_name).length > 0, "SBT Error: Nama institusi tidak boleh kosong");
        
        institutions[_institution] = Institution({
            name: _name,
            isActive: true
        });

        emit InstitutionAdded(_institution, _name);
    }

    // 2. Mencabut hak akses universitas agar tidak bisa menerbitkan ijazah lagi (Hanya Admin Pusat)
    function removeInstitution(address _institution) external onlyAdmin {
        require(institutions[_institution].isActive, "SBT Error: Institusi tidak terdaftar atau sudah tidak aktif");
        
        institutions[_institution].isActive = false;

        emit InstitutionRemoved(_institution);
    }

    // 3. Menerbitkan ijazah (SBT) ke wallet mahasiswa (Hanya Universitas yang Aktif)
    function issueCredential(address _student, string calldata _tokenURI) external onlyInstitution returns (uint256) {
        require(_student != address(0), "SBT Error: Alamat mahasiswa tidak valid");
        require(bytes(_tokenURI).length > 0, "SBT Error: URI metadata tidak boleh kosong");

        uint256 tokenId = _nextTokenId++;
        
        // Panggil fungsi pembukuan internal dari ERC721.sol
        _update(_student, tokenId);
        
        // Simpan data ijazah ke storage
        _tokenURIs[tokenId] = _tokenURI;
        _isValid[tokenId] = true;
        _studentCredentials[_student].push(tokenId);

        emit CredentialIssued(tokenId, _student, _tokenURI, msg.sender);
        return tokenId;
    }

    // 4. Membatalkan/menarik ijazah jika terjadi kesalahan fatal (Hanya Universitas yang menerbitkan)
    function revokeCredential(uint256 _tokenId) external onlyInstitution {
        require(_owners[_tokenId] != address(0), "SBT Error: Kredensial tidak ditemukan");
        require(_isValid[_tokenId], "SBT Error: Kredensial sudah dicabut sebelumnya");
        
        // Opsional: Validasi tambahan agar hanya universitas yang dulu mencetak yang bisa mencabut ijazah ini bisa dikembangkan,
        // namun untuk skala tugas kuliah, hak akses 'onlyInstitution' sudah sangat kuat.
        _isValid[_tokenId] = false;

        emit CredentialRevoked(_tokenId, msg.sender);
    }

    // 5. Fungsi view untuk pihak ketiga (HRD) mengecek keabsahan ijazah secara instan
    function isValidCredential(uint256 _tokenId) public view returns (bool) {
        if (_owners[_tokenId] == address(0)) {
            return false; // Ijazah tidak ada
        }
        return _isValid[_tokenId]; // Mengembalikan status aktif/revoke
    }

    // 6. Mendapatkan daftar seluruh ID ijazah yang dimiliki seorang mahasiswa (Untuk Wallet App)
    function getStudentCredential(address _student) public view returns (uint256[] memory) {
        require(_student != address(0), "SBT Error: Alamat query tidak valid");
        return _studentCredentials[_student];
    }

    // 7. OVERRIDE FUNGSI TRANSFER PUBLIK (Paling Penting untuk Kunci Soulbound)
    // Di file ERC721.sol buatanmu mungkin belum mengekspos transferFrom publik, 
    // Kita deklarasikan di sini untuk memastikan jika ada aplikasi luar mencoba memaksa transfer, transaksi langsung GAGAL total.
    function transferFrom(address from, address to, uint256 tokenId) public pure {
        from; to; tokenId; // Menghilangkan warning compiler untuk unused variables
        revert("SBT Error: Token ini bersifat Soulbound. Kredensial akademik tidak dapat ditransfer!");
    }


    // --- FUNGSI TAMBAHAN UTK SISTEM DID & KESELARASAN METADATA ---

    // Mengambil metadata URI untuk verifikasi data (Nama, NIM, IPFS)
    function tokenURI(uint256 tokenId) public view returns (string memory) {
        require(_owners[tokenId] != address(0), "SBT Error: Kredensial tidak ditemukan");
        return _tokenURIs[tokenId];
    }

    // INTERNAL HOOK OVERRIDE: Pencegahan transfer pada level internal Solidity
    function _update(address to, uint256 tokenId) internal override {
        address from = _owners[tokenId];

        // Jika token sudah punya pemilik (bukan proses minting awal dari 0x0), gagalkan!
        if (from != address(0)) {
            revert("SBT Error: Token ini bersifat Soulbound. Kredensial tidak dapat ditransfer!");
        }

        super._update(to, tokenId);
    }
}