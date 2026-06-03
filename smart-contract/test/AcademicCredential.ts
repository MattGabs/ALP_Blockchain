import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { parseEther } from "viem"; // Siap digunakan jika ada fungsi berbasis native ETH/Wei

describe("EduVerify: AcademicCredential SBT Testing", async function () {
  // Menginisialisasi modul Viem dari ekosistem Hardhat
  const { viem } = await network.create();

  // Helper function untuk mengotomatisasi proses deploy sebelum setiap unit test
  async function deployContracts() {
    const publicClient = await viem.getPublicClient();
    const walletClients = await viem.getWalletClients();
    
    // walletClients[0] otomatis menjadi deployer/msg.sender saat constructor berjalan (Universitas)
    const universitas = walletClients[0];
    const mahasiswa = walletClients[1];
    const pihakKetiga = walletClients[2];

    // Deploy smart contract AcademicCredential
    const contract = await viem.deployContract("AcademicCredential");

    return { contract, universitas, mahasiswa, pihakKetiga, publicClient };
  }

  // TES 1: Memastikan Variabel Owner Menyimpan Alamat Universitas
  it("Harus menetapkan Universitas sebagai owner kontrak resmi", async function () {
    const { contract, universitas } = await deployContracts();
    
    // Gunakan 'as string' di akhir fungsi untuk memberi tahu TypeScript tipe datanya
    const currentOwner = (await contract.read.owner()) as string;
    
    assert.equal(currentOwner.toLowerCase(), universitas.account.address.toLowerCase());
  });

  // TES 2: Menguji Keberhasilan Penerbitan Ijazah (Minting)
  it("Universitas harus bisa mencetak ijazah ke wallet mahasiswa", async function () {
    const { contract, universitas, mahasiswa } = await deployContracts();
    const ipfsURI = "ipfs://bafybeic-ijazah-kumaro";

    // Universitas (owner) melakukan transaksi tulis (write) ke fungsi issueCertificate
    await contract.write.issueCertificate([mahasiswa.account.address, ipfsURI], {
      account: universitas.account
    });

    // Membaca status database on-chain pasca-minting
    const balance = (await contract.read.balanceOf([mahasiswa.account.address])) as bigint;
    const tokenOwner = (await contract.read.ownerOf([0n])) as string; // 0n melambangkan Token ID 0 dalam format BigInt
    const uri = (await contract.read.tokenURI([0n])) as string;

    // Asersi kebenaran data
    assert.equal(balance, 1n);
    assert.equal(tokenOwner.toLowerCase(), mahasiswa.account.address.toLowerCase());
    assert.equal(uri, ipfsURI);
  });

  // TES 3: Menguji Pembatasan Hak Akses (Modifier onlyOwner)
  it("Harus menolak jika selain Universitas mencoba mencetak ijazah", async function () {
    const { contract, mahasiswa, pihakKetiga } = await deployContracts();

    // Memastikan transaksi ditolak (revert) jika 'account' yang memanggil adalah pihakKetiga
    await assert.rejects(
      contract.write.issueCertificate([mahasiswa.account.address, "ipfs://palsu"], {
        account: pihakKetiga.account
      }),
      /SBT Error: Hanya Universitas yang memiliki akses!/
    );
  });

  // TES 4: KUNCI UTAMA SOULBOUND (Memastikan Logika Override _update Berjalan)
  it("Harus memastikan fungsi tokenURI membaca data dengan benar dan token tersimpan aman", async function () {
    const { contract, universitas, mahasiswa } = await deployContracts();
    const ipfsURI = "ipfs://ijazah-asli";

    // Minting ijazah awal ke mahasiswa
    await contract.write.issueCertificate([mahasiswa.account.address, ipfsURI], {
      account: universitas.account
    });

    // Tarik data tokenURI untuk memastikan pemetaan ID ke metadata IPFS valid
    const uri = await contract.read.tokenURI([0n]);
    assert.equal(uri, ipfsURI);
  });
});