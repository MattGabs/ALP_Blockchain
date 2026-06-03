// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC721 {
    // Event yang wajib dinyalakan setiap ada perpindahan token (termasuk minting)
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    // Fungsi wajib untuk mengecek jumlah saldo token milik sebuah wallet
    function balanceOf(address owner) external view returns (uint256 balance);

    // Fungsi wajib untuk mengecek siapa pemilik sah dari sebuah Token ID
    function ownerOf(uint256 tokenId) external view returns (address owner);
}
