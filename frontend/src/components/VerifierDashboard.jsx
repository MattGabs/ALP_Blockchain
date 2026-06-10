import { useState } from 'react';
import { createPublicClient, http } from 'viem';
import { hardhat } from 'viem/chains';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contractConfig';

export default function VerifierDashboard({ onBack }) {
  const [tokenId, setTokenId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setResult(null);

    try {
      // 1. CEK ON-CHAIN (BLOCKCHAIN)
      const publicClient = createPublicClient({ chain: hardhat, transport: http('http://127.0.0.1:8545') });
      
      const isValid = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'isValidCredential',
        args: [BigInt(tokenId)]
      });

      // 2. CEK OFF-CHAIN (MYSQL)
      const response = await fetch(`http://localhost:5000/api/credentials/${tokenId}`);
      
      if (!response.ok) {
        throw new Error("Ijazah tidak ditemukan di database resmi.");
      }

      const dbData = await response.json();

      // Gabungkan hasil kesimpulan
      setResult({
        ...dbData,
        isBlockchainValid: isValid
      });

    } catch (err) {
      console.error(err);
      setErrorMsg(err.shortMessage || err.message || "Gagal memverifikasi ijazah.");
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg border border-slate-200 p-8">
        
        <button onClick={onBack} className="text-sm text-blue-600 hover:underline mb-6 flex items-center gap-1">
          &larr; Kembali ke Home
        </button>

        <h2 className="text-2xl font-bold text-slate-800 mb-2">Portal Verifikasi Ijazah</h2>
        <p className="text-sm text-slate-500 mb-6">Masukkan Token ID ijazah untuk mengecek keaslian dan statusnya secara real-time di jaringan Blockchain.</p>

        <form onSubmit={handleVerify} className="flex gap-2 mb-6">
          <input type="number" placeholder="Contoh Token ID: 0" required
            className="flex-grow p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={tokenId} onChange={(e) => setTokenId(e.target.value)} />
          <button type="submit" disabled={loading}
            className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:bg-slate-400">
            {loading ? 'Mengecek...' : 'Verifikasi'}
          </button>
        </form>

        {/* PESAN ERROR */}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {errorMsg}
          </div>
        )}

        {/* HASIL VERIFIKASI */}
        {result && (
          <div className={`p-6 rounded-lg border-2 ${result.isBlockchainValid ? 'border-emerald-500 bg-emerald-50' : 'border-red-500 bg-red-50'}`}>
            <div className="text-center mb-4">
              {result.isBlockchainValid ? (
                <div className="inline-block px-4 py-2 bg-emerald-600 text-white font-bold rounded-full text-sm shadow-sm">
                  ✓ IJAZAH VALID & ASLI
                </div>
              ) : (
                <div className="inline-block px-4 py-2 bg-red-600 text-white font-bold rounded-full text-sm shadow-sm">
                  ✕ IJAZAH TELAH DICABUT / PALSU
                </div>
              )}
            </div>

            <div className="space-y-3 mt-6">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pemilik Ijazah</p>
                <p className="font-semibold text-slate-800">{result.student_name} ({result.student_id})</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Detail Pendidikan</p>
                <p className="text-slate-800">{result.title} - {result.major}</p>
                <p className="text-sm text-slate-600">Predikat: {result.grade}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Penerbit Resmi</p>
                <p className="text-slate-800">{result.institution_name}</p>
              </div>
              <div>
                 <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-4">Jejak Blockchain (Wallet)</p>
                 <p className="text-[10px] font-mono text-slate-400 break-all">{result.student_wallet}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}