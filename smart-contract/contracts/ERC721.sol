// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IERC721.sol";

contract ERC721 is IERC721 {
    string public name;
    string public symbol;

    // Database Blockchain: Token ID => Alamat Pemilik
    mapping(uint256 => address) internal _owners;

    // Database Blockchain: Alamat Pemilik => Jumlah Token
    mapping(address => uint256) internal _balances;

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }

    // Merealisasikan janji dari IERC721
    function ownerOf(uint256 tokenId) public view virtual override returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "ERC721: Token ID tidak valid");
        return owner;
    }

    // Merealisasikan janji dari IERC721
    function balanceOf(address owner) public view virtual override returns (uint256) {
        require(owner != address(0), "ERC721: Alamat tidak boleh 0x0");
        return _balances[owner];
    }

    // Fungsi internal (pembukuan pusat) yang mengatur mutasi data di blockchain
    function _update(address to, uint256 tokenId) internal virtual {
        address from = _owners[tokenId];

        // Jika dari 0x0, artinya token BARU lahir (Minting), maka saldo penerima ditambah
        if (from == address(0)) {
            _balances[to] += 1;
        }

        // Tulis pemilik baru ke dalam storage blockchain
        _owners[tokenId] = to;

        // Pancarkan event yang dijanjikan di Interface
        emit Transfer(from, to, tokenId);
    }
}
