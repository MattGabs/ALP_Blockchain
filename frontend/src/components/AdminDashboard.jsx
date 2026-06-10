// src/components/AdminDashboard.jsx
import { useState } from 'react';
import { createWalletClient, custom } from 'viem';
import { hardhat } from 'viem/chains';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contractConfig'; 

export default function AdminDashboard({ account }) {
  const [instWallet, setInstWallet] = useState('');
  const [instName, setInstName] = useState('');
  const [instAccreditation, setInstAccreditation] = useState('');
  const [instEmail, setInstEmail] = useState('');
  const [isTxLoading, setIsTxLoading] = useState(false);
  const [revokeWallet, setRevokeWallet] = useState('');
  const [isRevokeLoading, setIsRevokeLoading] = useState(false);

  const registerNewInstitution = async (e) => {
    e.preventDefault();
    setIsTxLoading(true);

    try {
      const walletClient = createWalletClient({
        chain: hardhat,
        transport: custom(window.ethereum)
      });

      console.log("Meminta tanda tangan dompet...");
      const txHash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'addInstitution',
        args: [instWallet, instName, instAccreditation, instEmail],
        account: account
      });
      
      console.log("Transaksi Blockchain Sukses! Hash:", txHash);

      console.log("Menyimpan ke Database Lokal...");
      const dbResponse = await fetch('http://localhost:5000/api/institutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: instWallet,
          name: instName,
          accreditation: instAccreditation,
          email: instEmail
        })
      });

      if (!dbResponse.ok) throw new Error("Gagal menyimpan ke database");

      alert("Institusi Berhasil Didaftarkan di Blockchain & Database!");
      
      setInstWallet('');
      setInstName('');
      setInstAccreditation('');
      setInstEmail('');

    } catch (error) {
      console.error("Gagal mendaftarkan institusi:", error);
      alert("Terjadi kesalahan: " + (error.shortMessage || error.message));
    }
    
    setIsTxLoading(false);
  };

  // --- FUNGSI 2: MENCABUT IZIN INSTITUSI ---
  const handleRevokeInstitution = async (e) => {
    e.preventDefault();
    setIsRevokeLoading(true);

    try {
      // A. EKSEKUSI SMART CONTRACT (On-Chain)
      const walletClient = createWalletClient({
        chain: hardhat,
        transport: custom(window.ethereum)
      });

      console.log("Meminta tanda tangan dompet untuk mencabut izin...");
      const txHash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'removeInstitution', 
        args: [revokeWallet],
        account: account
      });
      
      console.log("Pencabutan Blockchain Sukses! Hash:", txHash);

      // B. EKSEKUSI DATABASE MYSQL (Off-Chain)
      console.log("Mencabut akses di Database Lokal...");
      const dbResponse = await fetch(`http://localhost:5000/api/institutions/remove/${revokeWallet}`, {
        method: 'PUT'
      });

      if (!dbResponse.ok) throw new Error("Gagal memperbarui status di database");

      alert("Akses Institusi Berhasil Dicabut di Blockchain & Database!");
      setRevokeWallet('');

    } catch (error) {
      console.error("Gagal mencabut izin institusi:", error);
      alert("Terjadi kesalahan: " + (error.shortMessage || error.message));
    }

    setIsRevokeLoading(false);
  };

  return (
    <div className="border-t pt-4">
      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">SYSTEM ADMINISTRATOR</span>
      <h2 className="text-xl font-bold text-slate-800 mt-2">Kementerian Pendidikan</h2>
      
      <div className="mt-4 p-4 bg-slate-100 rounded-lg border border-slate-300">
        <h3 className="font-bold text-sm mb-3">Daftarkan Institusi Baru</h3>
        <form onSubmit={registerNewInstitution} className="flex flex-col gap-2">
          <input type="text" placeholder="Wallet Address (0x...)" required
            className="p-2 text-sm border rounded"
            value={instWallet} onChange={(e) => setInstWallet(e.target.value)} />
          <input type="text" placeholder="Nama Universitas" required
            className="p-2 text-sm border rounded"
            value={instName} onChange={(e) => setInstName(e.target.value)} />
          <input type="text" placeholder="Akreditasi (Contoh: A)" required
            className="p-2 text-sm border rounded"
            value={instAccreditation} onChange={(e) => setInstAccreditation(e.target.value)} />
          <input type="email" placeholder="Email Institusi" required
            className="p-2 text-sm border rounded"
            value={instEmail} onChange={(e) => setInstEmail(e.target.value)} />
          
          <button type="submit" disabled={isTxLoading}
            className="mt-2 py-2 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-900 disabled:bg-slate-400">
            {isTxLoading ? 'Memproses Transaksi...' : 'Daftarkan ke Smart Contract'}
          </button>
        </form>
      </div>
      <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
        <h3 className="font-bold text-sm text-red-800 mb-3">Cabut Izin Institusi (Blacklist)</h3>
        <p className="text-xs text-red-600 mb-3">Tindakan ini akan menonaktifkan akses *login* dompet institusi tersebut secara permanen.</p>
        <form onSubmit={handleRevokeInstitution} className="flex flex-col gap-2">
          <input type="text" placeholder="Masukkan Wallet Address (0x...)" required
            className="p-2 text-sm border rounded border-red-300 focus:outline-none focus:ring-1 focus:ring-red-500"
            value={revokeWallet} onChange={(e) => setRevokeWallet(e.target.value)} />
          
          <button type="submit" disabled={isRevokeLoading}
            className="mt-2 py-2 bg-red-600 text-white text-sm font-bold rounded hover:bg-red-700 disabled:bg-red-400 transition-all">
            {isRevokeLoading ? 'Mencabut Izin...' : 'Cabut Akses Institusi'}
          </button>
        </form>
      </div>
    </div>
  );
}