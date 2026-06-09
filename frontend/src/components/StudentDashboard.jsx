import { useState, useEffect } from 'react';

export default function StudentDashboard({ profile }) {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyCredentials = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/credentials/student/${profile.wallet_address}`);
        if (response.ok) {
          const data = await response.json();
          setCredentials(data);
        }
      } catch (error) {
        console.error("Gagal memuat ijazah:", error);
      } finally {
        setLoading(false);
      }
    };

    if (profile?.wallet_address) {
      fetchMyCredentials();
    }
  }, [profile]);

  return (
    <div className="border-t pt-4">
      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">DASHBOARD MAHASISWA</span>
      <h2 className="text-xl font-bold text-slate-800 mt-2">{profile.full_name}</h2>
      <p className="text-sm text-slate-500 mb-4">
        NIM: <span className="font-semibold">{profile.student_id}</span> | {profile.major}
      </p>

      <h3 className="font-bold text-sm text-slate-800 mb-3 border-b pb-2">Koleksi Ijazah Digital (SBT)</h3>
      
      {loading ? (
        <p className="text-sm text-slate-500 animate-pulse">Memuat data ijazah...</p>
      ) : credentials.length === 0 ? (
        <div className="p-4 bg-slate-50 border rounded text-center text-slate-500 text-sm">
          Belum ada ijazah yang diterbitkan untuk akun ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {credentials.map((cred) => (
            <div key={cred.token_id} className={`p-4 rounded-lg border ${cred.is_revoked ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-slate-400">Token ID: #{cred.token_id}</span>
                {cred.is_revoked ? (
                  <span className="px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded">REVOKED / DIBATALKAN</span>
                ) : (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded">VALID</span>
                )}
              </div>
              <h4 className="font-bold text-slate-800">{cred.credential_type}</h4>
              <p className="text-sm font-semibold text-blue-600">{cred.title}</p>
              <p className="text-xs text-slate-500 mt-1">Diterbitkan oleh: {cred.institution_name}</p>
              <p className="text-xs text-slate-500">GPA: {cred.grade}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}