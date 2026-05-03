'use client';

import { useState, useEffect } from 'react';
import ClientModal from '@/components/ClientModal';
import { Plus, Search, Mail, Phone, Building2, Wallet, Activity, Hash } from 'lucide-react';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      if (Array.isArray(data)) {
        setClients(data);
      } else {
        setClients([]);
      }
    } catch (err) {
      console.error(err);
      setClients([]);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = Array.isArray(clients) ? clients.filter(client => 
    client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  const handleEdit = (client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this client? This will also delete their campaigns and transactions.')) {
      try {
        const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete client');
        setClients(clients.filter(c => c._id !== id));
      } catch (error) {
        alert(error.message);
      }
    }
  };

  const openAddModal = () => {
    setSelectedClient(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Clients</h1>
          <p className="text-slate-500">Manage your agency's client relationships.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Client
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400 ml-2" />
        <input 
          type="text" 
          placeholder="Search by name or company..." 
          className="flex-1 outline-none text-slate-600 bg-transparent"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
        {filteredClients.map((client) => (
          <div key={client._id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex flex-col lg:flex-row justify-between gap-6">
              {/* Left Side: Basic Info */}
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 font-bold text-xl shadow-inner">
                      {client.name?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{client.name}</h3>
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Building2 className="w-4 h-4" />
                        <span>{client.companyName}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${(client.balance || 0) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700 animate-pulse'}`}>
                    {(client.balance || 0) >= 0 ? 'Advance' : 'Due'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                  <div className="flex items-center gap-3 text-slate-500 text-sm">
                    <Mail className="w-4 h-4 text-primary-400" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 text-sm">
                    <Phone className="w-4 h-4 text-primary-400" />
                    <span>{client.phone}</span>
                  </div>
                </div>

                {/* Platform Rates Display */}
                <div className="grid grid-cols-3 gap-2 py-3 bg-slate-50 rounded-xl border border-slate-100 px-3">
                  <div className="text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Facebook</p>
                    <p className="text-sm font-bold text-slate-700">{client.rates?.Facebook || client.ratePerDollar || 120}</p>
                  </div>
                  <div className="text-center border-x border-slate-200">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Google</p>
                    <p className="text-sm font-bold text-slate-700">{client.rates?.Google || client.ratePerDollar || 120}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">TikTok</p>
                    <p className="text-sm font-bold text-slate-700">{client.rates?.TikTok || client.ratePerDollar || 120}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => handleEdit(client)}
                    className="flex-1 py-2 text-sm font-semibold text-slate-600 bg-slate-50 hover:bg-primary-50 hover:text-primary-600 rounded-xl transition-all"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(client._id)}
                    className="flex-1 py-2 text-sm font-semibold text-slate-600 bg-slate-50 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Right Side: Financial Summary */}
              <div className="lg:w-72 bg-slate-50/50 p-5 rounded-2xl space-y-4 border border-slate-100">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Wallet className="w-4 h-4" />
                    <span className="text-xs uppercase font-bold tracking-widest">Balance</span>
                  </div>
                  <span className={`text-lg font-black ${(client.balance || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${(client.balance || 0).toLocaleString()}
                  </span>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-200/60">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Total Budget:</span>
                    <span className="font-bold text-slate-800">${(client.totalBudget || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Total Paid:</span>
                    <span className="font-bold text-green-600">${(client.totalPaid || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Running Spend:</span>
                    <span className="font-bold text-orange-600">${(client.totalSpent || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Future Due:</span>
                    <span className="font-bold text-slate-800">${(client.futureDue || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ClientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchClients} 
        client={selectedClient}
      />
    </div>
  );
}
