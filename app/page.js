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
  const [refreshInterval, setRefreshInterval] = useState(30000); // default 30s
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [trackingDate, setTrackingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [customValue, setCustomValue] = useState(30);
  const [customUnit, setCustomUnit] = useState('s'); // 's' | 'm' | 'h'

  const unitMultiplier = { s: 1000, m: 60000, h: 3600000 };

  const applyCustomInterval = (val, unit) => {
    const ms = Math.max(0, Math.round(val * (unitMultiplier[unit] || 1000)));
    setRefreshInterval(ms);
    localStorage.setItem('dashboard-refresh-interval', ms.toString());
    localStorage.setItem('dashboard-refresh-value', val.toString());
    localStorage.setItem('dashboard-refresh-unit', unit);
  };

  const formatCountdown = (totalSeconds) => {
    if (totalSeconds <= 0) return 'Off';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.round(totalSeconds % 60);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const fetchStats = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      if (data && !data.error) {
        setStats(data);
      } else {
        console.error(data?.error || 'Failed to fetch stats');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Load saved interval preference
  useEffect(() => {
    const savedMs = localStorage.getItem('dashboard-refresh-interval');
    const savedVal = localStorage.getItem('dashboard-refresh-value');
    const savedUnit = localStorage.getItem('dashboard-refresh-unit');
    if (savedMs !== null) setRefreshInterval(parseInt(savedMs, 10));
    if (savedVal !== null) setCustomValue(parseFloat(savedVal));
    if (savedUnit !== null) setCustomUnit(savedUnit);
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchStats();
  }, []);

  // Handle the automatic timer and refresh
  useEffect(() => {
    if (refreshInterval <= 0) {
      setSecondsLeft(0);
      return;
    }

    setSecondsLeft(refreshInterval / 1000);

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          fetchStats();
          return refreshInterval / 1000;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [refreshInterval]);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              Financial Ledger
              {isRefreshing && (
                <Activity className="w-5 h-5 text-primary-500 animate-spin" />
              )}
            </h1>
            <p className="text-slate-500">Live accounting overview based on source truth.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {stats.isSystemSynced === false && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl">
                <AlertCircle className="w-4 h-4" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Sync Warning</span>
                  <span className="text-[9px]">Ledger mismatch. Contact Admin.</span>
                </div>
              </div>
            )}

            <div className="bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${refreshInterval > 0 ? 'bg-green-400' : 'bg-slate-400'} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${refreshInterval > 0 ? 'bg-green-500' : 'bg-slate-500'}`}></span>
                </span>
                <span className="font-medium text-slate-700">
                  {refreshInterval > 0 ? formatCountdown(secondsLeft) : 'Off'}
                </span>
              </div>

              <div className="h-4 w-[1px] bg-slate-200" />

              <input
                type="number"
                min="0"
                step="1"
                value={customValue}
                onChange={(e) => {
                  const v = parseFloat(e.target.value) || 0;
                  setCustomValue(v);
                  applyCustomInterval(v, customUnit);
                }}
                className="w-14 bg-slate-50 border border-slate-200 outline-none text-slate-700 font-bold py-1 px-2 rounded-lg text-center focus:ring-2 focus:ring-primary-500"
              />
              <select
                value={customUnit}
                onChange={(e) => {
                  setCustomUnit(e.target.value);
                  applyCustomInterval(customValue, e.target.value);
                }}
                className="bg-slate-50 border border-slate-200 outline-none text-slate-700 font-medium py-1 px-2 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <option value="s">Seconds</option>
                <option value="m">Minutes</option>
                <option value="h">Hours</option>
              </select>

              <button
                onClick={() => { setCustomValue(0); applyCustomInterval(0, customUnit); }}
                className={`px-2 py-1 rounded-lg font-medium transition-all ${
                  refreshInterval === 0
                    ? 'bg-red-100 text-red-600'
                    : 'text-slate-400 hover:bg-red-50 hover:text-red-500'
                }`}
                title="Stop Auto-Refresh"
              >
                Stop
              </button>

              <button
                onClick={fetchStats}
                disabled={isRefreshing}
                className={`p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-all ${
                  isRefreshing ? 'animate-spin' : ''
                }`}
                title="Sync Now"
              >
                <Activity className="w-4 h-4" />
              </button>
            </div>
          </div>
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
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between items-center gap-4 group hover:border-primary-200 transition-all">
          <div className="text-center">
            <p className="text-sm font-medium text-slate-500 mb-1">Manual Update</p>
            <h3 className="text-lg font-bold text-slate-900">Daily Tracking</h3>
          </div>
          
          <div className="w-full flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">Select Target Date</label>
            <input 
              type="date" 
              value={trackingDate} 
              onChange={(e) => setTrackingDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-medium text-slate-700 bg-slate-50"
            />
          </div>

          <button 
            onClick={async () => {
              const res = await fetch(`/api/cron/daily-spend?date=${trackingDate}`);
              const data = await res.json();
              if (data.success) {
                alert(`Daily spend tracking updated successfully for ${trackingDate}!`);
                window.location.reload();
              } else {
                alert('Error: ' + data.error);
              }
            }}
            className="w-full py-2 bg-primary-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-700 transition-all text-xs"
          >
            <Activity className="w-4 h-4" />
            Run Tracker
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

