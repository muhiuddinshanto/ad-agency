'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { toast } from 'react-hot-toast';

export default function LoadModal({ isOpen, onClose, onSuccess, initialClientId }) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    client: '',
    usdAmount: '',
    note: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (isOpen) {
      fetch('/api/clients')
        .then(res => res.json())
        .then(data => {
          setClients(data);
          if (initialClientId) {
            setFormData(prev => ({ ...prev, client: initialClientId }));
          }
        })
        .catch(err => console.error(err));
    }
  }, [isOpen, initialClientId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/loads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to record load');
      }
      toast.success('USD Load recorded successfully!');
      setFormData({
        client: formData.client,
        usdAmount: '',
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
    <Modal isOpen={isOpen} onClose={onClose} title="Load USD to Account">
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <label className="block text-sm font-medium text-slate-700 mb-1">USD Amount</label>
          <input
            required
            type="number"
            step="0.01"
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
            placeholder="e.g. 1000"
            value={formData.usdAmount}
            onChange={(e) => setFormData({ ...formData, usdAmount: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Load Date</label>
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
            placeholder="Ad account ID, platform, etc."
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
          {loading ? 'Recording...' : 'Save Load'}
        </button>
      </form>
    </Modal>
  );
}
