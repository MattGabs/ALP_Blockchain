import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";

describe("AcademicCredential Testing (Viem & Node Native)", async function () {
  const { viem } = await network.create();

  async function deployFixture() {
    const clients = await viem.getWalletClients();
    const admin = clients[0];
    const institution = clients[1];
    const student = clients[2];
    const hacker = clients[3];

    const academicCredential = await viem.deployContract("AcademicCredential");

    return { academicCredential, admin, institution, student, hacker };
  }

  describe("Kasus Positif (Berhasil)", () => {
    it("1. Admin berhasil menambahkan alamat institusi", async function () {
      const { academicCredential, admin, institution } = await deployFixture();

      await academicCredential.write.addInstitution(
        [institution.account.address, "Universitas A", "Akreditasi A", "admin@univa.edu"],
        { account: admin.account }
      );

      // Transaksi read: Membaca mapping struct akan mengembalikan array tuple.
      // Properti 'isRegistered' berada di urutan ke-5 (index 4) pada struct Institution.
      const institutionData = await academicCredential.read.institutions([institution.account.address]);
      
      assert.equal(institutionData[4], true);
    });

    it("2. Institusi terdaftar berhasil menerbitkan ijazah (SBT)", async function () {
      const { academicCredential, admin, institution, student } = await deployFixture();

      await academicCredential.write.addInstitution(
        [institution.account.address, "Universitas A", "Akreditasi A", "admin@univa.edu"],
        { account: admin.account }
      );

      const tokenURI = "ipfs://dokumen-ijazah-dummy";
      
      await academicCredential.write.issueCredential(
        [student.account.address, "Diploma", "Bachelor of Computer Science", "3.85", tokenURI],
        { account: institution.account }
      );

      const owner = await academicCredential.read.ownerOf([0n]);
      
      assert.equal(owner.toLowerCase(), student.account.address.toLowerCase());
    });

    it("3. Institusi berhasil membatalkan (revoke) ijazah", async function () {
      const { academicCredential, admin, institution, student } = await deployFixture();

      await academicCredential.write.addInstitution(
        [institution.account.address, "Universitas A", "Akreditasi A", "admin@univa.edu"], 
        { account: admin.account }
      );
      
      await academicCredential.write.issueCredential(
        [student.account.address, "Diploma", "Bachelor of Computer Science", "3.85", "ipfs://dokumen-ijazah-dummy"], 
        { account: institution.account }
      );

      await academicCredential.write.revokeCredential([0n], { account: institution.account });

      const isValid = await academicCredential.read.isValidCredential([0n]);
      
      assert.equal(isValid, false);
    });
  });

  describe("Kasus Negatif (Gagal / Revert)", () => {
    it("1. Gagal menambahkan institusi jika diakses oleh selain Admin", async function () {
      const { academicCredential, hacker, institution } = await deployFixture();

      await assert.rejects(
        academicCredential.write.addInstitution(
          [institution.account.address, "Universitas Palsu", "Tidak Ada", "hacker@fake.com"],
          { account: hacker.account }
        ),
        (err: any) => err.message.includes("Akses ditolak: Hanya untuk Admin")
      );
    });

    it("2. Gagal menerbitkan ijazah jika dilakukan oleh institusi tidak terdaftar", async function () {
      const { academicCredential, hacker, student } = await deployFixture();

      await assert.rejects(
        academicCredential.write.issueCredential(
          [student.account.address, "Diploma", "Bachelor of Computer Science", "3.85", "ipfs://fake-uri"],
          { account: hacker.account }
        ),
        (err: any) => err.message.includes("Akses ditolak: Bukan institusi pendidikan terdaftar")
      );
    });

    it("3. Gagal memindahtangankan ijazah (Memastikan fitur Soulbound Token berjalan)", async function () {
      const { academicCredential, admin, institution, student, hacker } = await deployFixture();

      await academicCredential.write.addInstitution(
        [institution.account.address, "Universitas A", "Akreditasi A", "admin@univa.edu"], 
        { account: admin.account }
      );
      
      await academicCredential.write.issueCredential(
        [student.account.address, "Diploma", "Bachelor of Computer Science", "3.85", "ipfs://dokumen-ijazah-dummy"], 
        { account: institution.account }
      );

      await assert.rejects(
        academicCredential.write.transferFrom(
          [student.account.address, hacker.account.address, 0n],
          { account: student.account }
        ),
        (err: any) => err.message.includes("Soulbound Token: Ijazah tidak dapat dipindahtangankan")
      );
    });
  });
});