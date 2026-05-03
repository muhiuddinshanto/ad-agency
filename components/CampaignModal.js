'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { toast } from 'react-hot-toast';

export default function CampaignModal({ isOpen, onClose, onSuccess, campaign = null }) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    name: campaign?.name || '',
    client: campaign?.client?._id || campaign?.client || '',
    platform: campaign?.platform || 'Facebook',
    dailyBudget: campaign?.dailyBudget || '',
    startDate: campaign?.startDate ? new Date(campaign.startDate).toISOString().slice(0, 16) : '',
    endDate: campaign?.endDate ? new Date(campaign.endDate).toISOString().slice(0, 16) : '',
    status: campaign?.status || 'running'
  });

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name,
        client: campaign.client?._id || campaign.client,
        platform: campaign.platform,
        dailyBudget: campaign.dailyBudget,
        startDate: new Date(campaign.startDate).toISOString().slice(0, 16),
        endDate: new Date(campaign.endDate).toISOString().slice(0, 16),
        status: campaign.status
      });
    } else {
      setFormData({
        name: '',
        client: '',
        platform: 'Facebook',
        dailyBudget: '',
        startDate: '',
        endDate: '',
        status: 'running'
      });
    }
  }, [campaign]);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/clients')
        .then(res => res.json())
        .then(data => setClients(data))
        .catch(err => console.error(err));
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = campaign ? `/api/campaigns/${campaign._id}` : '/api/campaigns';
      const method = campaign ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to ${campaign ? 'update' : 'create'} campaign`);
      }

      toast.success(`Campaign ${campaign ? 'updated' : 'launched'} successfully!`);
      if (!campaign) {
        setFormData({
          name: '',
          client: '',
          platform: 'Facebook',
          dailyBudget: '',
          startDate: '',
          endDate: '',
          status: 'running'
        });
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={campaign ? 'Manage Campaign' : 'Launch New Campaign'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Campaign Name</label>
          <input
            required
            type="text"
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
            placeholder="Summer Sale 2024"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Select Client</label>
          <select
            required
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
            value={formData.client}
            onChange={(e) => setFormData({ ...formData, client: e.target.value })}
          >
            <option value="">Choose a client...</option>
            {clients.map(c => (
              <option key={c._id} value={c._id}>{c.name} ({c.companyName})</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Platform</label>
            <select
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
            >
              <option value="Facebook">Facebook</option>
              <option value="Google">Google</option>
              <option value="TikTok">TikTok</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Daily Budget (USD)
              {formData.client && formData.platform && (
                <span className="text-primary-600 ml-2 font-bold">
                  ≈ {(() => {
                    const client = clients.find(c => c._id === formData.client);
                    const rate = client?.rates?.[formData.platform] || client?.ratePerDollar || 120;
                    return ((parseFloat(formData.dailyBudget) || 0) * rate).toLocaleString();
                  })()} BDT
                </span>
              )}
            </label>
            <input
              required
              type="number"
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="50"
              value={formData.dailyBudget}
              onChange={(e) => setFormData({ ...formData, dailyBudget: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Start Date & Time</label>
            <input
              required
              type="datetime-local"
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">End Date & Time</label>
            <input
              required
              type="datetime-local"
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>
        </div>

        {formData.startDate && formData.endDate && formData.dailyBudget && (
          <div className="bg-primary-50 p-4 rounded-xl border border-primary-100">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600 font-medium">Precise Duration:</span>
              <span className="text-primary-700 font-bold">
                {(() => {
                  const start = new Date(formData.startDate);
                  const end = new Date(formData.endDate);
                  const hours = Math.max(0, (end - start) / (1000 * 60 * 60));
                  return `${(hours / 24).toFixed(2)} days (${Math.round(hours)}h)`;
                })()}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm mt-2 border-t border-primary-100 pt-2">
              <span className="text-slate-600 font-medium">Estimated Total Cost:</span>
              <span className="text-primary-700 font-bold text-lg">
                ${(() => {
                  const start = new Date(formData.startDate);
                  const end = new Date(formData.endDate);
                  const hours = Math.max(0, (end - start) / (1000 * 60 * 60));
                  return ((parseFloat(formData.dailyBudget) || 0) * (hours / 24)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                })()}
              </span>
            </div>
          </div>
        )}
        
        {campaign && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="running">Running</option>
              <option value="paused">Paused</option>
            </select>
          </div>
        )}

        <button
          disabled={loading}
          type="submit"
          className="w-full py-3 min-h-[44px] bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          {loading ? (campaign ? 'Updating...' : 'Launching...') : (campaign ? 'Update Campaign' : 'Create Campaign')}
        </button>
      </form>
    </Modal>
  );
}
