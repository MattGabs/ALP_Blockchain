// import assert from "node:assert/strict";
// import { describe, it } from "node:test";
// import { network } from "hardhat";

// describe("AcademicCredential Testing (Viem & Node Native)", async function () {
//   const { viem } = await network.create();

//   async function deployFixture() {
//     // Mendapatkan simulasi akun (wallets)
//     const clients = await viem.getWalletClients();
//     const admin = clients[0];
//     const institution = clients[1];
//     const student = clients[2];
//     const hacker = clients[3];

//     // Deploy kontrak
//     const academicCredential = await viem.deployContract("AcademicCredential");

//     return { academicCredential, admin, institution, student, hacker };
//   }

//   describe("Kasus Positif (Berhasil)", () => {
//     it("1. Admin berhasil menambahkan alamat institusi", async function () {
//       const { academicCredential, admin, institution } = await deployFixture();

//       // Transaksi write (butuh menentukan account siapa yang mengeksekusi)
//       await academicCredential.write.addInstitution(
//         [institution.account.address, "Universitas A"],
//         { account: admin.account }
//       );

//       // Transaksi read
//       const isInstitution = await academicCredential.read.institutions([institution.account.address]);
      
//       assert.equal(isInstitution, true);
//     });

//     it("2. Institusi terdaftar berhasil menerbitkan ijazah (SBT)", async function () {
//       const { academicCredential, admin, institution, student } = await deployFixture();

//       // Setup: Admin menambahkan institusi
//       await academicCredential.write.addInstitution(
//         [institution.account.address, "Universitas A"],
//         { account: admin.account }
//       );

//       const tokenURI = "ipfs://dokumen-ijazah-dummy";
      
//       // Institusi menerbitkan SBT
//       await academicCredential.write.issueCredential(
//         [student.account.address, tokenURI],
//         { account: institution.account }
//       );

//       // Cek pemilik ID token 0 (Di Viem, parameter angka besar harus format BigInt/0n)
//       const owner = await academicCredential.read.ownerOf([0n]);
      
//       // Pastikan alamat sesuai
//       assert.equal(owner.toLowerCase(), student.account.address.toLowerCase());
//     });

//     it("3. Institusi berhasil membatalkan (revoke) ijazah", async function () {
//       const { academicCredential, admin, institution, student } = await deployFixture();

//       // Setup
//       await academicCredential.write.addInstitution([institution.account.address, "Universitas A"], { account: admin.account });
//       await academicCredential.write.issueCredential([student.account.address, "ipfs://dokumen-ijazah-dummy"], { account: institution.account });

//       // Institusi membatalkan ijazah ID 0
//       await academicCredential.write.revokeCredential([0n], { account: institution.account });

//       // Cek validasi
//       const isValid = await academicCredential.read.isValidCredential([0n]);
      
//       assert.equal(isValid, false);
//     });
//   });

//   describe("Kasus Negatif (Gagal / Revert)", () => {
//     it("1. Gagal menambahkan institusi jika diakses oleh selain Admin", async function () {
//       const { academicCredential, hacker, institution } = await deployFixture();

//       // Menggunakan assert.rejects untuk memastikan fungsi gagal (revert)
//       await assert.rejects(
//         academicCredential.write.addInstitution(
//           [institution.account.address, "Universitas Palsu"],
//           { account: hacker.account } // Dieksekusi oleh hacker
//         ),
//         (err: any) => err.message.includes("Akses ditolak: Hanya untuk Admin")
//       );
//     });

//     it("2. Gagal menerbitkan ijazah jika dilakukan oleh institusi tidak terdaftar", async function () {
//       const { academicCredential, hacker, student } = await deployFixture();

//       // Hacker (bukan institusi) mencoba menerbitkan
//       await assert.rejects(
//         academicCredential.write.issueCredential(
//           [student.account.address, "ipfs://fake-uri"],
//           { account: hacker.account }
//         ),
//         (err: any) => err.message.includes("Akses ditolak: Bukan institusi pendidikan terdaftar")
//       );
//     });

//     it("3. Gagal memindahtangankan ijazah (Memastikan fitur Soulbound Token berjalan)", async function () {
//       const { academicCredential, admin, institution, student, hacker } = await deployFixture();

//       // Setup
//       await academicCredential.write.addInstitution([institution.account.address, "Universitas A"], { account: admin.account });
//       await academicCredential.write.issueCredential([student.account.address, "ipfs://dokumen-ijazah-dummy"], { account: institution.account });

//       // Mahasiswa (student) mencoba mentransfer ijazah ID 0 ke wallet hacker
//       await assert.rejects(
//         academicCredential.write.transferFrom(
//           [student.account.address, hacker.account.address, 0n],
//           { account: student.account }
//         ),
//         (err: any) => err.message.includes("Soulbound Token: Ijazah tidak dapat dipindahtangankan")
//       );
//     });
//   });
// });