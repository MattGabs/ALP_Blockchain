import { useState } from 'react';
import AdminDashboard from './components/AdminDashboard';
import InstitutionDashboard from './components/InstitutionDashboard';
import StudentDashboard from './components/StudentDashboard';
import VerifierDashboard from './components/VerifierDashboard'; 

const ADMIN_WALLET = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266".toLowerCase();

function App() {
  const [account, setAccount] = useState(null);
  const [role, setRole] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // State khusus untuk layar Verifikator (Publik)
  const [isVerifier, setIsVerifier] = useState(false);

  const checkUserRole = async (walletAddress) => {
    setLoading(true);
    const normalizedWallet = walletAddress.toLowerCase();

    try {
      if (normalizedWallet === ADMIN_WALLET) {
        setRole('admin');
        setProfile({ name: "Super Administrator" });
        setLoading(false);
        return; 
      }

      const instResponse = await fetch(`http://localhost:5000/api/institutions/${normalizedWallet}`);
      if (instResponse.ok) {
        const instData = await instResponse.json();
        if (instData.is_registered === 1) {
          setRole('institution');
          setProfile(instData);
          setLoading(false);
          return; 
        }
      }

      const studentResponse = await fetch(`http://localhost:5000/api/students/${normalizedWallet}`);
      if (studentResponse.ok) {
        const studentData = await studentResponse.json();
        setRole('student');
        setProfile(studentData);
        setLoading(false);
        return; 
      }

      setRole('unregistered');
      setProfile(null);

    } catch (error) {
      console.error("Gagal sinkronisasi dengan backend:", error);
    }
    setLoading(false);
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const connectedAddress = accounts[0];
        setAccount(connectedAddress); 
        await checkUserRole(connectedAddress);
      } catch (error) {
        console.error("Koneksi dibatalkan oleh pengguna", error);
      }
    } else {
      alert("Tolong install ekstensi Rabby Wallet atau MetaMask!");
    }
  };

  // Jika user memilih masuk sebagai HRD/Publik
  if (isVerifier) {
    return <VerifierDashboard onBack={() => setIsVerifier(false)} />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <h1 className="text-4xl font-extrabold text-slate-800 mb-8 text-center">
        Portal Ijazah Digital <br/> <span className="text-xl text-blue-600">Berbasis Blockchain</span>
      </h1>
      
      {!account && (
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button onClick={connectWallet} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 transition-all">
            Login dengan Wallet
          </button>
          
          <div className="flex items-center justify-center space-x-2 text-slate-400">
            <span className="h-px bg-slate-300 w-1/4"></span>
            <span className="text-xs">ATAU</span>
            <span className="h-px bg-slate-300 w-1/4"></span>
          </div>

          <button onClick={() => setIsVerifier(true)} className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-lg shadow hover:bg-emerald-700 transition-all">
            Verifikasi Ijazah (Publik)
          </button>
        </div>
      )}

      {account && loading && (
        <p className="text-slate-500 font-medium animate-pulse">Memverifikasi data profil...</p>
      )}

      {account && !loading && (
        <div className="w-full max-w-2xl p-6 bg-white rounded-xl shadow-md border border-slate-200">
          <div className="flex justify-between items-center mb-4">
             <div>
                <p className="text-xs text-slate-400 font-mono">WALLET ADDRESS:</p>
                <p className="font-mono text-xs text-slate-700 bg-slate-100 p-2 rounded overflow-x-auto">
                  {account}
                </p>
             </div>
             <button onClick={() => window.location.reload()} className="text-xs text-red-500 hover:underline">Logout</button>
          </div>

          {/* Rendering Komponen Berdasarkan Role */}
          {role === 'admin' && <AdminDashboard account={account} />}
          {role === 'institution' && <InstitutionDashboard profile={profile} account={account} />}
          {role === 'student' && <StudentDashboard profile={profile} />}
          
          {role === 'unregistered' && (
            <div className="border-t pt-4 text-center">
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">BELUM TERDAFTAR</span>
              <p className="text-sm text-slate-600 mt-3">Alamat dompet Anda belum terdaftar di sistem kami.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;