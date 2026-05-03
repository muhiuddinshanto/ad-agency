'use client';

import { useState, useEffect } from 'react';
import StatsCard from '@/components/StatsCard';
import { DollarSign, Zap, AlertCircle, Users } from 'lucide-react';

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
          description="Current spend until today"
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

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        <div className="bg-white p-4 md:p-8 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Clients with Due Balance</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-4 font-semibold text-slate-600">Client Name</th>
                  <th className="pb-4 font-semibold text-slate-600">Company</th>
                  <th className="pb-4 font-semibold text-slate-600">Balance</th>
                  <th className="pb-4 font-semibold text-slate-600 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(!stats.unpaidClients || stats.unpaidClients.length === 0) ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-400">No pending payments! All clients are up to date.</td>
                  </tr>
                ) : (
                  stats.unpaidClients.map((client) => (
                    <tr key={client._id} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-4 font-medium text-slate-900">{client.name}</td>
                      <td className="py-4 text-slate-500">{client.companyName}</td>
                      <td className="py-4">
                        <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-sm font-bold">
                          -${Math.abs(client.balance || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button className="text-primary-600 font-semibold hover:underline">Remind</button>
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

