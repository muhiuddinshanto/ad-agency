'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { toast } from 'react-hot-toast';

export default function TransactionModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    client: '',
    platform: 'General',
    bdtAmount: '',
    note: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [convertedUsd, setConvertedUsd] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/clients')
        .then(res => res.json())
        .then(data => setClients(data))
        .catch(err => console.error(err));
    }
  }, [isOpen]);

  useEffect(() => {
    const selectedClient = clients.find(c => c._id === formData.client);
    if (selectedClient && formData.bdtAmount) {
      // Logic for rate: 
      // 1. If platform is General, try ratePerDollar
      // 2. If platform is specific, try rates[platform]
      let rate = selectedClient.ratePerDollar || 120;
      if (formData.platform !== 'General' && selectedClient.rates?.[formData.platform]) {
        rate = selectedClient.rates[formData.platform];
      } else if (formData.platform === 'General' && selectedClient.rates?.Facebook) {
        // Default general rate to Facebook if available
        rate = selectedClient.rates.Facebook;
      }
      
      const usd = parseFloat(formData.bdtAmount) / rate;
      setConvertedUsd(usd);
    } else {
      setConvertedUsd(0);
    }
  }, [formData.client, formData.platform, formData.bdtAmount, clients]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to record payment');
      }
      toast.success('Payment recorded successfully!');
      setFormData({
        client: '',
        platform: 'General',
        bdtAmount: '',
        note: '',
        date: new Date().toISOString().split('T')[0]
      });
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Payment">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Platform (for Rate)</label>
            <select
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
            >
              <option value="General">General (Default)</option>
              <option value="Facebook">Facebook</option>
              <option value="Google">Google</option>
              <option value="TikTok">TikTok</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount (BDT)</label>
            <input
              required
              type="number"
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="e.g. 120000"
              value={formData.bdtAmount}
              onChange={(e) => setFormData({ ...formData, bdtAmount: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Converted USD</label>
            <div className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-bold">
              ${convertedUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Payment Date</label>
          <input
            required
            type="date"
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Note (Optional)</label>
          <textarea
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
            placeholder="Bank transfer, PayPal, etc."
            rows="3"
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          />
        </div>
        <button
          disabled={loading}
          type="submit"
          className="w-full py-3 min-h-[44px] bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Recording...' : 'Save Payment'}
        </button>
      </form>
    </Modal>
  );
}
