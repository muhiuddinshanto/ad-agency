'use client';

import { useState, useEffect } from 'react';
import StatsCard from '@/components/StatsCard';
import { DollarSign, Zap, AlertCircle, Users, History, Activity } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalAdSpend: 0,
    todaySpend: 0,
    totalDue: 0,
    totalCampaignBudget: 0,
    totalRevenue: 0,
    totalRunningSpend: 0,
    unpaidClients: []
  });

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setStats(data);
        } else {
          console.error(data?.error || 'Failed to fetch stats');
        }
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Financial Ledger</h1>
            <p className="text-slate-500">Live accounting overview based on source truth.</p>
          </div>
          {stats.isSystemSynced === false && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl">
              <AlertCircle className="w-5 h-5" />
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider">Sync Warning</span>
                <span className="text-[10px]">Ledger mismatch detected. Contact Admin.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard 
          title="Today Spend" 
          value={`$${(stats.todaySpend || 0).toLocaleString()}`} 
          icon={Zap} 
          description="Total ad spend recorded today"
          color="purple"
        />
        <StatsCard 
          title="Yesterday Spend" 
          value={`$${(stats.yesterdaySpend || 0).toLocaleString()}`} 
          icon={History} 
          description="Total ad spend recorded yesterday"
          color="blue"
        />
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center items-center gap-4 group hover:border-primary-200 transition-all">
          <div className="text-center">
            <p className="text-sm font-medium text-slate-500 mb-1">Manual Update</p>
            <h3 className="text-lg font-bold text-slate-900">Daily Tracking</h3>
          </div>
          <button 
            onClick={async () => {
              const res = await fetch('/api/cron/daily-spend');
              const data = await res.json();
              if (data.success) {
                alert('Daily spend tracking updated successfully!');
                window.location.reload();
              } else {
                alert('Error: ' + data.error);
              }
            }}
            className="w-full py-2 bg-primary-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-700 transition-all"
          >
            <Activity className="w-4 h-4" />
            Run Tracker Now
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Budget" 
          value={`$${(stats.totalCampaignBudget || 0).toLocaleString()}`} 
          icon={DollarSign} 
          description="Sum of all Campaign budgets"
          color="blue"
        />
        <StatsCard 
          title="Running Spend" 
          value={`$${(stats.totalRunningSpend || 0).toLocaleString()}`} 
          icon={Zap} 
          description="Actual sum of DailySpend"
          color="orange"
        />
        <StatsCard 
          title="Total Paid" 
          value={`$${(stats.totalRevenue || 0).toLocaleString()}`} 
          icon={DollarSign} 
          description="Total locked USD collected"
          color="green"
        />
        <StatsCard 
          title="Total Outstanding Due" 
          value={`$${(stats.totalDue || 0).toLocaleString()}`} 
          icon={AlertCircle} 
          description="Total (Spend - Paid) for all clients"
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <History className="w-5 h-5 text-primary-500" />
            Spend History (Last 14 Days)
          </h2>
          <div className="space-y-4">
            {(!stats.spendHistory || stats.spendHistory.length === 0) ? (
              <p className="text-slate-400 italic">No spend history recorded yet.</p>
            ) : (
              stats.spendHistory.slice().reverse().map((item) => (
                <div key={item._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-medium text-slate-600">{new Date(item._id).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  <span className="font-bold text-slate-900">${item.amount.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Active Receivables
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-4 font-semibold text-slate-600">Client</th>
                  <th className="pb-4 font-semibold text-slate-600 text-center">Status</th>
                  <th className="pb-4 font-semibold text-slate-600 text-right">Due (USD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(!stats.unpaidClients || stats.unpaidClients.length === 0) ? (
                  <tr>
                    <td colSpan="3" className="py-8 text-center text-slate-400">All up to date!</td>
                  </tr>
                ) : (
                  stats.unpaidClients.map((client) => (
                    <tr key={client._id} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{client.name}</span>
                          <span className="text-xs text-slate-500">{client.companyName}</span>
                        </div>
                      </td>
                      <td className="py-4 text-center">
                        {client.isOverdrawn ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-100 text-red-600 animate-pulse">
                            Overdrawn
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${client.serviceType === 'wallet' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                            {client.serviceType === 'wallet' ? 'Wallet' : 'Campaign'}
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className={`${client.isOverdrawn || client.dueUSD > 0 ? 'text-red-600' : 'text-slate-600'} font-bold`}>
                            ${(client.dueUSD || 0).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">৳{(client.dueBDT || 0).toLocaleString()}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

