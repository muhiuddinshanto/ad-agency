'use client';

import { useState, useEffect } from 'react';
import LoadModal from '@/components/LoadModal';
import TransactionModal from '@/components/TransactionModal';
import { Wallet, ArrowUpCircle, Receipt, History, Search, Plus, DollarSign, ArrowDownCircle } from 'lucide-react';

export default function WalletPage() {
  const [clients, setClients] = useState([]);
  const [loads, setLoads] = useState([]);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [isTransModalOpen, setIsTransModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      const [clientsRes, loadsRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/loads')
      ]);
      const clientsData = await clientsRes.json();
      const loadsData = await loadsRes.json();

      if (Array.isArray(clientsData)) {
        setClients(clientsData.filter(c => c.serviceType === 'wallet'));
      }
      if (Array.isArray(loadsData)) {
        setLoads(loadsData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredClients = clients.filter(client =>
    client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddLoad = (clientId) => {
    setSelectedClientId(clientId);
    setIsLoadModalOpen(true);
  };

  const handleAddPayment = (clientId) => {
    setSelectedClientId(clientId);
    setIsTransModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Wallet / USD Load</h1>
          <p className="text-slate-500">Manage dollar loads and payments for wallet clients.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400 ml-2" />
        <input 
          type="text" 
          placeholder="Search wallet clients..." 
          className="flex-1 outline-none text-slate-600 bg-transparent"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredClients.map((client) => (
          <div key={client._id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex flex-col lg:flex-row justify-between gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 font-bold text-lg">
                    {client.name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{client.name}</h3>
                    <p className="text-sm text-slate-500">{client.companyName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Total Loaded</p>
                    <p className="text-lg font-black text-slate-700">${(client.totalLoaded || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Total Paid (USD)</p>
                    <p className="text-lg font-black text-green-600">${(client.totalPaid || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Wallet Balance</p>
                    <p className={`text-lg font-black ${(client.walletBalance || 0) < 0 ? 'text-red-600' : 'text-primary-600'}`}>
                      ${(client.walletBalance || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Status</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${(client.walletBalance || 0) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700 animate-pulse'}`}>
                      {(client.walletBalance || 0) >= 0 ? 'Credit' : 'Overdrawn'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button 
                    onClick={() => handleAddLoad(client._id)}
                    className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20"
                  >
                    <ArrowUpCircle className="w-5 h-5" />
                    Add USD Load
                  </button>
                  <button 
                    onClick={() => handleAddPayment(client._id)}
                    className="flex-1 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
                  >
                    <Receipt className="w-5 h-5" />
                    Add Payment (BDT)
                  </button>
                </div>
              </div>

              <div className="lg:w-96 border-l border-slate-100 lg:pl-8">
                <div className="flex items-center gap-2 mb-4 text-slate-900 font-bold">
                  <History className="w-4 h-4 text-primary-500" />
                  <span>Recent Load History</span>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {loads.filter(l => l.client?._id === client._id).length === 0 ? (
                    <p className="text-sm text-slate-400 italic py-4">No load history yet.</p>
                  ) : (
                    loads.filter(l => l.client?._id === client._id).map((load) => (
                      <div key={load._id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-primary-200 transition-all">
                        <div>
                          <p className="text-sm font-bold text-slate-700">${load.usdAmount.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400">{new Date(load.date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 truncate max-w-[100px] block">{load.note || 'Load'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredClients.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">No Wallet Clients</h2>
            <p className="text-slate-500 max-w-xs mx-auto mt-2">
              Only clients with service type "wallet" will appear here.
            </p>
          </div>
        )}
      </div>

      <LoadModal 
        isOpen={isLoadModalOpen} 
        onClose={() => setIsLoadModalOpen(false)} 
        onSuccess={fetchData} 
        initialClientId={selectedClientId}
      />

      <TransactionModal 
        isOpen={isTransModalOpen} 
        onClose={() => setIsTransModalOpen(false)} 
        onSuccess={fetchData} 
        initialClientId={selectedClientId}
      />
    </div>
  );
}
