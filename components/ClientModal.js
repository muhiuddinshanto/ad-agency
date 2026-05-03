'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { toast } from 'react-hot-toast';

export default function ClientModal({ isOpen, onClose, onSuccess, client = null }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    ratePerDollar: '',
    rates: {
      Facebook: 120,
      Google: 120,
      TikTok: 120
    }
  });

  // Update form data when client prop changes
  useEffect(() => {
    if (client && isOpen) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        companyName: client.companyName || '',
        ratePerDollar: client.ratePerDollar || '120',
        rates: {
          Facebook: client.rates?.Facebook || client.ratePerDollar || 120,
          Google: client.rates?.Google || client.ratePerDollar || 120,
          TikTok: client.rates?.TikTok || client.ratePerDollar || 120
        }
      });
    } else if (isOpen) {
      setFormData({ 
        name: '', 
        email: '', 
        phone: '', 
        companyName: '', 
        ratePerDollar: '120',
        rates: {
          Facebook: 120,
          Google: 120,
          TikTok: 120
        }
      });
    }
  }, [client, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = client ? `/api/clients/${client._id}` : '/api/clients';
      const method = client ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to ${client ? 'update' : 'create'} client`);
      }
      
      toast.success(`Client ${client ? 'updated' : 'created'} successfully!`);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRateChange = (platform, value) => {
    setFormData(prev => ({
      ...prev,
      rates: {
        ...prev.rates,
        [platform]: parseFloat(value) || 0
      }
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={client ? 'Edit Client' : 'Add New Client'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
          <input
            required
            type="text"
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input
              required
              type="email"
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
            <input
              required
              type="text"
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              placeholder="+1 234 567 890"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
          <input
            required
            type="text"
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            placeholder="Acme Corp"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          />
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
          <p className="text-sm font-bold text-slate-900 uppercase tracking-wider">Platform Rates (BDT/$)</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Facebook</label>
              <input
                required
                type="number"
                step="0.1"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                value={formData.rates.Facebook}
                onChange={(e) => handleRateChange('Facebook', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Google</label>
              <input
                required
                type="number"
                step="0.1"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                value={formData.rates.Google}
                onChange={(e) => handleRateChange('Google', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">TikTok</label>
              <input
                required
                type="number"
                step="0.1"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                value={formData.rates.TikTok}
                onChange={(e) => handleRateChange('TikTok', e.target.value)}
              />
            </div>
          </div>
        </div>

        <button
          disabled={loading}
          type="submit"
          className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          {loading ? (client ? 'Updating...' : 'Adding...') : (client ? 'Update Client' : 'Add Client')}
        </button>
      </form>
    </Modal>
  );
}
