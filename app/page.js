'use client';

import { useState, useEffect } from 'react';
import StatsCard from '@/components/StatsCard';
import { DollarSign, Zap, AlertCircle, Users, History, Activity } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalAdSpend: 0,
    todaySpend: 0,
    totalDue: 0,
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
        <h1 className="text-3xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500">Welcome back! Here's what's happening today.</p>
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
          title="Total Planned Budget" 
          value={`$${(stats.totalPlannedBudget || 0).toLocaleString()}`} 
          icon={DollarSign} 
          description="Total budget across all campaigns"
          color="blue"
        />
        <StatsCard 
          title="Total Running Spend" 
          value={`$${(stats.totalRunningSpend || 0).toLocaleString()}`} 
          icon={Zap} 
          description="Sum of all recorded daily spends"
          color="orange"
        />
        <StatsCard 
          title="Total Paid (USD)" 
          value={`$${(stats.totalPaid || 0).toLocaleString()}`} 
          icon={DollarSign} 
          description="Total payments converted to USD"
          color="green"
        />
        <StatsCard 
          title="Total Due" 
          value={`$${(stats.totalDue || 0).toLocaleString()}`} 
          icon={AlertCircle} 
          description="Outstanding balance from clients"
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
            Clients with Due Balance
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-4 font-semibold text-slate-600">Client Name</th>
                  <th className="pb-4 font-semibold text-slate-600 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(!stats.unpaidClients || stats.unpaidClients.length === 0) ? (
                  <tr>
                    <td colSpan="2" className="py-8 text-center text-slate-400">All up to date!</td>
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
                      <td className="py-4 text-right">
                        <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-sm font-bold">
                          -${Math.abs(client.balance || 0).toLocaleString()}
                        </span>
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

