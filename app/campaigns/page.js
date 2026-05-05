'use client';

import { useState, useEffect } from 'react';
import CampaignModal from '@/components/CampaignModal';
import { Plus, Search, Calendar, Target, PlayCircle, PauseCircle, TrendingUp, DollarSign } from 'lucide-react';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCampaigns(data);
      } else {
        setCampaigns([]);
      }
    } catch (err) {
      console.error(err);
      setCampaigns([]);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const filteredCampaigns = Array.isArray(campaigns) ? campaigns.filter(camp => {
    const matchesSearch = camp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         camp.client?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const isCampaignClient = camp.client?.serviceType === 'campaign';
    return matchesSearch && isCampaignClient;
  }) : [];

  const handleEdit = (campaign) => {
    setSelectedCampaign(campaign);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      try {
        const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete campaign');
        setCampaigns(campaigns.filter(c => c._id !== id));
      } catch (error) {
        alert(error.message);
      }
    }
  };

  const openAddModal = () => {
    setSelectedCampaign(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Campaigns</h1>
          <p className="text-slate-500">Track and manage your active ad campaigns.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Campaign
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400 ml-2" />
        <input 
          type="text" 
          placeholder="Search by campaign or client name..." 
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
                <th className="px-6 py-4 font-semibold text-slate-600">Campaign Details</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Client</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Platform</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-center">Budget</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-center">Running Spend</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCampaigns.map((camp) => (
                <tr key={camp._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{camp.name}</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {camp.startDate ? new Date(camp.startDate).toLocaleDateString() : 'N/A'} - {camp.endDate ? new Date(camp.endDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-600 font-medium">{camp.client?.name || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      camp.platform === 'Facebook' ? 'bg-blue-50 text-blue-600' : 
                      camp.platform === 'Google' ? 'bg-red-50 text-red-600' : 
                      'bg-black text-white'
                    }`}>
                      {camp.platform}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-slate-900">
                        ${(camp.type === 'daily' ? (camp.dailyBudget || 0) : (camp.totalBudget || 0)).toLocaleString()}
                        <small className="text-slate-400 font-normal ml-1">
                          {camp.type === 'daily' ? '/day' : '(lifetime)'}
                        </small>
                      </span>
                      <div className="flex flex-col items-center mt-1">
                        {camp.type === 'daily' && (
                          <span className="text-[10px] uppercase font-bold text-slate-400">Total: ${(camp.totalBudget || 0).toLocaleString()}</span>
                        )}
                        <span className="text-[10px] text-primary-500 font-bold">
                          {(() => {
                            const start = new Date(camp.startDate);
                            const end = new Date(camp.endDate);
                            const hours = Math.max(0, (end - start) / (1000 * 60 * 60));
                            const days = hours / 24;
                            return `${days.toFixed(2)} days (${Math.round(hours)}h)`;
                          })()}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-sm font-bold">
                      ${(camp.runningSpend || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {camp.status === 'running' ? (
                        <><PlayCircle className="w-4 h-4 text-green-500" /><span className="text-sm font-medium text-green-600 capitalize">{camp.status}</span></>
                      ) : (
                        <><PauseCircle className="w-4 h-4 text-slate-400" /><span className="text-sm font-medium text-slate-500 capitalize">{camp.status}</span></>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(camp)}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                      >
                        Manage
                      </button>
                      <button 
                        onClick={() => handleDelete(camp._id)}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCampaigns.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-400">No campaigns found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CampaignModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchCampaigns} 
        campaign={selectedCampaign}
      />
    </div>
  );
}
