import { useState } from "react";

function App() {
  const [wallet, setWallet] = useState("");

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("Rabby Wallet tidak ditemukan");
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      setWallet(accounts[0]);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Navbar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">
            Academic Credential
          </h1>

          <button
            onClick={connectWallet}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
          >
            {wallet
              ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
              : "Connect Rabby"}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-5xl font-bold text-slate-800 mb-6">
              Blockchain Academic Credential System
            </h1>

            <p className="text-slate-600 text-lg mb-8">
              Securely issue, verify, and manage academic credentials using NFT
              Soulbound Tokens on blockchain technology.
            </p>

            <div className="flex gap-4">
              <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">
                Issue Credential
              </button>

              <button className="border border-indigo-600 text-indigo-600 px-6 py-3 rounded-lg hover:bg-indigo-50">
                Verify Credential
              </button>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-xl font-semibold mb-4">
                Credential Statistics
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-50 p-4 rounded-xl">
                  <h3 className="text-sm text-gray-500">
                    Institutions
                  </h3>
                  <p className="text-3xl font-bold text-indigo-600">
                    12
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-xl">
                  <h3 className="text-sm text-gray-500">
                    Credentials
                  </h3>
                  <p className="text-3xl font-bold text-green-600">
                    256
                  </p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-xl">
                  <h3 className="text-sm text-gray-500">
                    Students
                  </h3>
                  <p className="text-3xl font-bold text-yellow-600">
                    180
                  </p>
                </div>

                <div className="bg-red-50 p-4 rounded-xl">
                  <h3 className="text-sm text-gray-500">
                    Revoked
                  </h3>
                  <p className="text-3xl font-bold text-red-600">
                    2
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-bold text-center mb-10">
          Features
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-xl font-semibold mb-3">
              NFT Credential
            </h3>
            <p className="text-gray-600">
              Academic certificates are issued as Soulbound NFTs.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-xl font-semibold mb-3">
              Verification
            </h3>
            <p className="text-gray-600">
              Anyone can verify credential authenticity on-chain.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-xl font-semibold mb-3">
              Revocation
            </h3>
            <p className="text-gray-600">
              Institutions can revoke invalid credentials securely.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;