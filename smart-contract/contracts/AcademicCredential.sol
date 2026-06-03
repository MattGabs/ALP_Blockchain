// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AcademicCredential is ERC721URIStorage, Ownable {

    uint256 private _nextTokenId;

    struct Institution {
        string name;
        bool isRegistered;
    }

    mapping(address => Institution) public institutions;

    mapping(uint256 => bool) public revokedCredentials;

    mapping(address => uint256[]) private studentCredentials;

    event InstitutionAdded(
        address indexed institution,
        string name
    );

    event InstitutionRemoved(
        address indexed institution
    );

    event CredentialIssued(
        uint256 indexed tokenId,
        address indexed student,
        string tokenURI
    );

    event CredentialRevoked(
        uint256 indexed tokenId
    );

    modifier onlyInstitution() {
        require(
            institutions[msg.sender].isRegistered,
            "Not authorized institution"
        );
        _;
    }

    constructor()
        ERC721("Academic Credential", "ACRED")
        Ownable(msg.sender)
    {}

    // =====================================================
    // ADMIN FUNCTIONS
    // =====================================================

    function addInstitution(
        address institution,
        string calldata name
    )
        external
        onlyOwner
    {
        require(
            institution != address(0),
            "Invalid address"
        );

        require(
            !institutions[institution].isRegistered,
            "Institution already exists"
        );

        institutions[institution] = Institution({
            name: name,
            isRegistered: true
        });

        emit InstitutionAdded(
            institution,
            name
        );
    }

    function removeInstitution(
        address institution
    )
        external
        onlyOwner
    {
        require(
            institutions[institution].isRegistered,
            "Institution not found"
        );

        delete institutions[institution];

        emit InstitutionRemoved(
            institution
        );
    }

    // =====================================================
    // CREDENTIAL FUNCTIONS
    // =====================================================

    function issueCredential(
        address student,
        string calldata tokenURI_
    )
        external
        onlyInstitution
        returns (uint256)
    {
        require(
            student != address(0),
            "Invalid student address"
        );

        uint256 tokenId = ++_nextTokenId;

        _safeMint(
            student,
            tokenId
        );

        _setTokenURI(
            tokenId,
            tokenURI_
        );

        studentCredentials[student]
            .push(tokenId);

        emit CredentialIssued(
            tokenId,
            student,
            tokenURI_
        );

        return tokenId;
    }

    function revokeCredential(
        uint256 tokenId
    )
        external
        onlyInstitution
    {
        require(
            _ownerOf(tokenId) != address(0),
            "Credential not found"
        );

        revokedCredentials[tokenId] = true;

        emit CredentialRevoked(
            tokenId
        );
    }

    // =====================================================
    // VIEW FUNCTIONS
    // =====================================================

    function isValidCredential(
        uint256 tokenId
    )
        external
        view
        returns (bool)
    {
        return (
            _ownerOf(tokenId) != address(0) &&
            !revokedCredentials[tokenId]
        );
    }

    function getStudentCredentials(
        address student
    )
        external
        view
        returns (uint256[] memory)
    {
        return studentCredentials[student];
    }

    function getCredentialURI(
        uint256 tokenId
    )
        external
        view
        returns (string memory)
    {
        require(
            _ownerOf(tokenId) != address(0),
            "Token not found"
        );

        return tokenURI(tokenId);
    }

    function getInstitutionName(
        address institution
    )
        external
        view
        returns (string memory)
    {
        require(
            institutions[institution].isRegistered,
            "Institution not found"
        );

        return institutions[institution].name;
    }

    // =====================================================
    // SOULBOUND LOGIC (OpenZeppelin v5)
    // =====================================================

    function _update(
        address to,
        uint256 tokenId,
        address auth
    )
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);

        // Mint diperbolehkan
        if (from == address(0)) {
            return super._update(
                to,
                tokenId,
                auth
            );
        }

        // Semua transfer diblokir
        revert("Soulbound token: transfer disabled");
    }
}