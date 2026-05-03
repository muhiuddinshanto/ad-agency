'use client';

import { useState, useEffect } from 'react';
import TransactionModal from '@/components/TransactionModal';
import { Plus, Search, ArrowUpRight, Receipt, User, Trash2, Banknote, Globe } from 'lucide-react';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions');
      const data = await res.json();
      if (Array.isArray(data)) {
        setTransactions(data);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error(err);
      setTransactions([]);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredTransactions = Array.isArray(transactions) ? transactions.filter(t => 
    t.client?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.note?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this transaction? This will update the client balance.')) {
      try {
        const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete transaction');
        setTransactions(transactions.filter(t => t._id !== id));
      } catch (error) {
        alert(error.message);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Transactions</h1>
          <p className="text-slate-500">Record and review client payments.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Record Payment
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400 ml-2" />
        <input 
          type="text" 
          placeholder="Search by client or note..." 
          className="flex-1 outline-none text-slate-600 bg-transparent"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 font-semibold text-slate-600">Date</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Client</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Platform</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-center">Amount (BDT)</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-center">Amount (USD)</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Rate</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTransactions.map((t) => (
                <tr key={t._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-slate-600 font-medium">{t.date ? new Date(t.date).toLocaleDateString() : 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-slate-900">{t.client?.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      t.platform === 'Facebook' ? 'bg-blue-50 text-blue-600' :
                      t.platform === 'Google' ? 'bg-red-50 text-red-600' :
                      t.platform === 'TikTok' ? 'bg-slate-900 text-white' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {t.platform || 'General'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-900 font-bold">
                      {t.bdtAmount?.toLocaleString()} <small className="font-normal text-slate-400">BDT</small>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-green-600 font-bold">
                      <ArrowUpRight className="w-4 h-4" />
                      ${(t.usdAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-2 py-1 bg-slate-100 text-slate-500 rounded-md font-mono">
                      {t.rateAtTime}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleDelete(t._id)}
                        className="text-slate-400 hover:text-red-600 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-400">No transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchTransactions} 
      />
    </div>
  );
}
