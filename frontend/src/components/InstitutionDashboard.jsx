import { useState } from 'react';
import { createWalletClient,createPublicClient, custom } from 'viem';
import { hardhat } from 'viem/chains';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contractConfig';

export default function InstitutionDashboard({ profile, account }) {
  // --- STATE FORM 1: REGISTER STUDENT ---
  const [studentWallet, setStudentWallet] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [major, setMajor] = useState('');
  const [enrollmentYear, setEnrollmentYear] = useState('');
  const [isRegLoading, setIsRegLoading] = useState(false);

  // --- STATE FORM 2: ISSUE CREDENTIAL ---
  const [issueWallet, setIssueWallet] = useState('');
  const [credType, setCredType] = useState('Ijazah S1');
  const [title, setTitle] = useState('');
  const [grade, setGrade] = useState('');
  const [tokenURI, setTokenURI] = useState('');
  const [isIssueLoading, setIsIssueLoading] = useState(false);

  // --- STATE FORM 3: REVOKE CREDENTIAL ---
  const [revokeTokenId, setRevokeTokenId] = useState('');
  const [isRevokeLoading, setIsRevokeLoading] = useState(false);

  // =======================================================
  // FUNGSI 1: DAFTARKAN MAHASISWA BARU
  // =======================================================
  const handleRegisterStudent = async (e) => {
    e.preventDefault();
    setIsRegLoading(true);
    try {
      const walletClient = createWalletClient({ chain: hardhat, transport: custom(window.ethereum) });
      
      console.log("On-Chain: Mendaftarkan mahasiswa...");
      const txHash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'registerStudent',
        args: [studentWallet, fullName, studentId, major, BigInt(enrollmentYear)],
        account: account
      });
      console.log("Sukses On-Chain! Hash:", txHash);

      console.log("Off-Chain: Simpan ke MySQL...");
      const dbResponse = await fetch('http://localhost:5000/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: studentWallet,
          full_name: fullName,
          student_id: studentId,
          major: major,
          enrollment_year: parseInt(enrollmentYear)
        })
      });

      if (!dbResponse.ok) throw new Error("Gagal sinkron ke MySQL");

      alert("Mahasiswa berhasil didaftarkan di Smart Contract & Database!");
      setStudentWallet(''); setFullName(''); setStudentId(''); setMajor(''); setEnrollmentYear('');
    } catch (error) {
      console.error(error);
      alert("Error: " + (error.shortMessage || error.message));
    }
    setIsRegLoading(false);
  };

  // =======================================================
  // FUNGSI 2: TERBITKAN IJAZAH (ISSUE CREDENTIAL SBT)
  // =======================================================
  const handleIssueCredential = async (e) => {
    e.preventDefault();
    setIsIssueLoading(true);
    try {
      const walletClient = createWalletClient({ chain: hardhat, transport: custom(window.ethereum) });
      
      // Tambahkan Public Client untuk membaca data dari blockchain
      const publicClient = createPublicClient({ chain: hardhat, transport: custom(window.ethereum) });

      console.log("On-Chain: Menerbitkan Ijazah SBT...");
      const txHash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'issueCredential',
        args: [issueWallet.trim(), credType, title, grade, tokenURI], // pakai .trim() untuk cegah error spasi
        account: account
      });
      
      console.log("Menunggu blok ditambang (mining)...");
      // 1. Tunggu sampai transaksi benar-benar selesai di blockchain
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      console.log("Sukses On-Chain! Hash:", txHash);

      // 2. Ambil Token ID terbaru milik mahasiswa tersebut
      const studentCreds = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'getStudentCredential',
          args: [issueWallet.trim()]
      });
      
      // Mengambil elemen terakhir dari array ijazah (ijazah yang baru terbit)
      const latestTokenId = Number(studentCreds[studentCreds.length - 1]);

      console.log(`Off-Chain: Simpan ke MySQL dengan Token ID: ${latestTokenId}`);
      
      // 3. Kirim ke Backend dengan nama parameter yang cocok!
      const dbResponse = await fetch('http://localhost:5000/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token_id: latestTokenId,            
          student_wallet: issueWallet.trim(), // Disesuaikan
          institution_wallet: account,
          credential_type: credType,
          title: title,
          grade: grade,
          ipfs_uri: tokenURI                  // Disesuaikan
        })
      });

      if (!dbResponse.ok) throw new Error("Gagal sinkron ke MySQL");

      alert(`Ijazah Digital (SBT) Berhasil Diterbitkan dengan Token ID: ${latestTokenId}!`);
      
      // Reset form
      setIssueWallet(''); setTitle(''); setGrade(''); setTokenURI('');
    } catch (error) {
      console.error(error);
      alert("Error: " + (error.shortMessage || error.message));
    }
    setIsIssueLoading(false);
  };

  // =======================================================
  // FUNGSI 3: CABUT IJAZAH (REVOKE CREDENTIAL)
  // =======================================================
  const handleRevokeCredential = async (e) => {
    e.preventDefault();
    setIsRevokeLoading(true);
    try {
      const walletClient = createWalletClient({ chain: hardhat, transport: custom(window.ethereum) });

      console.log("On-Chain: Mencabut ijazah...");
      const txHash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'revokeCredential',
        args: [BigInt(revokeTokenId)],
        account: account
      });
      console.log("Sukses On-Chain! Hash:", txHash);

      console.log("Off-Chain: Update status di MySQL...");
      const dbResponse = await fetch(`http://localhost:5000/api/credentials/revoke/${revokeTokenId}`, {
        method: 'PUT'
      });

      if (!dbResponse.ok) console.warn("Peringatan: Gagal update MySQL, tapi ijazah sudah ditarik di blockchain.");

      alert(`Ijazah dengan Token ID ${revokeTokenId} resmi dibatalkan!`);
      setRevokeTokenId('');
    } catch (error) {
      console.error(error);
      alert("Error: " + (error.shortMessage || error.message));
    }
    setIsRevokeLoading(false);
  };

  return (
    <div className="border-t pt-4">
      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded">DASHBOARD KAMPUS</span>
      <h2 className="text-xl font-bold text-slate-800 mt-2">{profile?.name}</h2>
      <p className="text-sm text-slate-500 font-medium mb-4">Akreditasi: {profile?.accreditation} | Email: {profile?.email}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* BLOK 1: DAFTAR MAHASISWA */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 mb-3 border-b pb-2">1. Daftarkan Mahasiswa</h3>
          <form onSubmit={handleRegisterStudent} className="flex flex-col gap-2">
            <input type="text" placeholder="Wallet Address (0x...)" required
              className="p-2 text-sm border rounded" value={studentWallet} onChange={(e) => setStudentWallet(e.target.value)} />
            <input type="text" placeholder="Nama Lengkap (Contoh: Axel Valerio)" required
              className="p-2 text-sm border rounded" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <input type="text" placeholder="NIM" required
              className="p-2 text-sm border rounded" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
            <input type="text" placeholder="Program Studi (Contoh: Cybersecurity)" required
              className="p-2 text-sm border rounded" value={major} onChange={(e) => setMajor(e.target.value)} />
            <input type="number" placeholder="Tahun Masuk (Contoh: 2023)" required
              className="p-2 text-sm border rounded" value={enrollmentYear} onChange={(e) => setEnrollmentYear(e.target.value)} />
            
            <button type="submit" disabled={isRegLoading}
              className="mt-2 py-2 bg-purple-600 text-white text-sm font-bold rounded hover:bg-purple-700 disabled:bg-slate-400">
              {isRegLoading ? 'Memproses...' : 'Daftarkan Mahasiswa'}
            </button>
          </form>
        </div>

        {/* BLOK 2: TERBITKAN IJAZAH (SBT) */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 mb-3 border-b pb-2">2. Terbitkan Ijazah (SBT)</h3>
          <form onSubmit={handleIssueCredential} className="flex flex-col gap-2">
            <input type="text" placeholder="Wallet Mahasiswa (0x...)" required
              className="p-2 text-sm border rounded" value={issueWallet} onChange={(e) => setIssueWallet(e.target.value)} />
            <select className="p-2 text-sm border rounded bg-white" value={credType} onChange={(e) => setCredType(e.target.value)}>
              <option value="Ijazah S1">Ijazah S1</option>
              <option value="Ijazah S2">Ijazah S2</option>
              <option value="Sertifikat Pelatihan">Sertifikat Kompetensi</option>
            </select>
            <input type="text" placeholder="Gelar (Contoh: S.Kom)" required
              className="p-2 text-sm border rounded" value={title} onChange={(e) => setTitle(e.target.value)} />
            <input type="text" placeholder="GPA (Contoh: 3.5)" required
              className="p-2 text-sm border rounded" value={grade} onChange={(e) => setGrade(e.target.value)} />
            <input type="text" placeholder="IPFS Token URI (Link JSON Metadata)" required
              className="p-2 text-sm border rounded" value={tokenURI} onChange={(e) => setTokenURI(e.target.value)} />
            
            <button type="submit" disabled={isIssueLoading}
              className="mt-2 py-2 bg-green-600 text-white text-sm font-bold rounded hover:bg-green-700 disabled:bg-slate-400">
              {isIssueLoading ? 'Menerbitkan SBT...' : 'Terbitkan Ijazah'}
            </button>
          </form>
        </div>

      </div>

      {/* BLOK 3: CABUT IJAZAH */}
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm">
        <h3 className="font-bold text-sm text-red-800 mb-2">3. Cabut Ijazah (Revoke)</h3>
        <p className="text-xs text-red-600 mb-3">Batalkan ijazah jika terjadi pelanggaran atau pemalsuan data.</p>
        <form onSubmit={handleRevokeCredential} className="flex flex-col md:flex-row gap-2">
          <input type="number" placeholder="Masukkan Token ID (Contoh: 0)" required
            className="p-2 text-sm border border-red-300 rounded flex-grow focus:outline-none focus:ring-1 focus:ring-red-500" 
            value={revokeTokenId} onChange={(e) => setRevokeTokenId(e.target.value)} />
          <button type="submit" disabled={isRevokeLoading}
            className="px-6 py-2 bg-red-600 text-white text-sm font-bold rounded hover:bg-red-700 disabled:bg-red-400 whitespace-nowrap">
            {isRevokeLoading ? 'Mencabut...' : 'Tarik Ijazah'}
          </button>
        </form>
      </div>

    </div>
  );
}