import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { parseEther } from "viem";

describe("EduVerify: AcademicCredential Multi-Institution & DID SBT Testing", async function () {
  const { viem } = await network.create();

  // Helper function untuk otomasi deploy dan penyiapan aktor/wallet
  async function deployContracts() {
    const publicClient = await viem.getPublicClient();
    const walletClients = await viem.getWalletClients();
    
    // Alokasi wallet berdasarkan hierarki arsitektur baru
    const adminPusat = walletClients[0];   // Deployer (Kementerian)
    const universitas = walletClients[1];  // Institusi Pendidikan
    const mahasiswa = walletClients[2];    // Pemilik Ijazah (Holder)
    const pihakKetiga = walletClients[3];  // HRD / Hacker / Wallet Lain

    const contractRaw = await viem.deployContract("AcademicCredential");
    const contract = contractRaw as any;

    return { contract, adminPusat, universitas, mahasiswa, pihakKetiga, publicClient };
  }

  // =========================================================================
  // 3 POSITIVE CASES (SKENARIO SUKSES)
  // =========================================================================

  it("Positive Case 1: Admin Pusat harus berhasil mendaftarkan Institusi baru", async function () {
    const { contract, adminPusat, universitas } = await deployContracts();
    const namaKampus = "Universitas Surabaya";

    // Admin mendaftarkan universitas 
    await contract.write.addInstitution([universitas.account.address, namaKampus], {
      account: adminPusat.account
    });

    // Ambil data institusi dari public mapping 
    const res = await contract.read.institutions([universitas.account.address]) as [string, boolean];
    const [name, isActive] = res;

    assert.equal(name, namaKampus);
    assert.equal(isActive, true);
  });

  it("Positive Case 2: Institusi aktif harus sukses menerbitkan kredensial (DID & State Check)", async function () {
    const { contract, adminPusat, universitas, mahasiswa } = await deployContracts();
    const ipfsURI = "ipfs://bafybeic-ijazah-kumaro";

    // 1. Daftarkan dulu universitas agar aktif 
    await contract.write.addInstitution([universitas.account.address, "Airlangga University"], {
      account: adminPusat.account
    });

    // 2. Universitas menerbitkan ijazah ke mahasiswa 
    await contract.write.issueCredential([mahasiswa.account.address, ipfsURI], {
      account: universitas.account
    });

    // 3. Ambil data ijazah & status DID 
    const tokenOwner = (await contract.read.ownerOf([0n])) as string;
    const isValid = (await contract.read.isValidCredential([0n])) as boolean;
    const studentSBTList = (await contract.read.getStudentCredential([mahasiswa.account.address])) as bigint[];

    assert.equal(tokenOwner.toLowerCase(), mahasiswa.account.address.toLowerCase());
    assert.equal(isValid, true);
    assert.equal(studentSBTList.length, 1);
    assert.equal(studentSBTList[0], 0n);
  });

  it("Positive Case 3: Institusi harus bisa melakukan Revocation (Pencabutan) terhadap ijazah yang bermasalah", async function () {
    const { contract, adminPusat, universitas, mahasiswa } = await deployContracts();
    
    await contract.write.addInstitution([universitas.account.address, "ITS"], { account: adminPusat.account });
    await contract.write.issueCredential([mahasiswa.account.address, "ipfs://ijazah-salah"], { account: universitas.account });

    // Pastikan sebelum dicabut statusnya valid 
    assert.equal((await contract.read.isValidCredential([0n])) as boolean, true);

    // Universitas mencabut ijazah (Token ID 0) 
    await contract.write.revokeCredential([0n], {
      account: universitas.account
    });

    // Status validasi ijazah harus berubah menjadi false 
    const isValidPostRevoke = (await contract.read.isValidCredential([0n])) as boolean;
    assert.equal(isValidPostRevoke, false);
  });


  // =========================================================================
  // 3 NEGATIVE CASES (SKENARIO GAGAL / REVERT CONTROL)
  // =========================================================================

  it("Negative Case 1: Harus menolak (revert) jika selain Admin mencoba mendaftarkan Institusi", async function () {
    const { contract, universitas, pihakKetiga } = await deployContracts();

    // Pihak ketiga menembak fungsi addInstitution, harus digagalkan oleh modifier onlyAdmin 
    await assert.rejects(
      contract.write.addInstitution([universitas.account.address, "Kampus Ilegal"], {
        account: pihakKetiga.account
      }),
      /SBT Error: Hanya Admin Pusat yang memiliki akses!/
    );
  });

  it("Negative Case 2: Harus menolak jika Institusi yang sudah dicabut haknya (Non-Aktif) mencoba mencetak ijazah", async function () {
    const { contract, adminPusat, universitas, mahasiswa } = await deployContracts();

    // 1. Daftarkan institusi 
    await contract.write.addInstitution([universitas.account.address, "Petra"], { account: adminPusat.account });
    
    // 2. Cabut hak akses institusi tersebut 
    await contract.write.removeInstitution([universitas.account.address], { account: adminPusat.account });

    // 3. Coba mencetak ijazah, harus gagal karena modifier onlyInstitution 
    await assert.rejects(
      contract.write.issueCredential([mahasiswa.account.address, "ipfs://ijazah-ilegal"], {
        account: universitas.account
      }),
      /SBT Error: Hanya Institusi terdaftar yang memiliki akses!/
    );
  });

  it("Negative Case 3: KUNCI MATI SOULBOUND - Harus menggagalkan total segala upaya transfer token dari sisi publik", async function () {
    const { contract, adminPusat, universitas, mahasiswa, pihakKetiga } = await deployContracts();

    await contract.write.addInstitution([universitas.account.address, "Ciputra"], { account: adminPusat.account });
    await contract.write.issueCredential([mahasiswa.account.address, "ipfs://ijazah-asli"], { account: universitas.account });

    // Simulasikan mahasiswa mencoba memanggil transferFrom publik ke pihakKetiga 
    await assert.rejects(
      contract.write.transferFrom([mahasiswa.account.address, pihakKetiga.account.address, 0n], {
        account: mahasiswa.account
      }),
      /SBT Error: Token ini bersifat Soulbound. Kredensial akademik tidak dapat ditransfer!/
    );
  });
});