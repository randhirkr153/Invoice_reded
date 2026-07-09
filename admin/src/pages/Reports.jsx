import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReports } from '../redux/slices/adminSlice';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  TrendingUp, Clock, AlertTriangle, FileText, 
  Award, RefreshCw, BarChart3, PieChartIcon 
} from 'lucide-react';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

export default function Reports() {
  const dispatch = useDispatch();
  const { reports, loading } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchReports());
  }, [dispatch]);

  const stats = reports?.stats || {
    totalInvoicesCount: 0,
    paidRevenue: 0,
    pendingRevenue: 0,
    draftCount: 0,
    paidCount: 0,
    unpaidCount: 0,
    overdueCount: 0
  };

  const monthlyTrend = reports?.monthlyRevenueTrend || [];
  const topClients = reports?.topClients || [];
  
  // Pie chart formatting
  const statusData = [
    { name: 'Paid', value: stats.paidCount },
    { name: 'Unpaid', value: stats.unpaidCount },
    { name: 'Overdue', value: stats.overdueCount },
    { name: 'Draft', value: stats.draftCount },
  ].filter(item => item.value > 0);

  if (loading && !reports) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight font-sans">Financial Reports</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Analyze sales metrics, top revenue-generating clients, and payment collections.
        </p>
      </div>

      {/* Grid statistics summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl card-shadow">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gross Billing</span>
          <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white font-sans">
            ₹{(stats.paidRevenue + stats.pendingRevenue).toFixed(2)}
          </h3>
        </div>
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl card-shadow">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Collections (Paid)</span>
          <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400 font-sans">
            ₹{stats.paidRevenue.toFixed(2)}
          </h3>
        </div>
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl card-shadow">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Receivables (Unpaid)</span>
          <h3 className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400 font-sans">
            ₹{stats.pendingRevenue.toFixed(2)}
          </h3>
        </div>
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl card-shadow">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Collection Rate</span>
          <h3 className="text-2xl font-bold mt-1 text-brand-600 dark:text-brand-400 font-sans">
            {stats.paidRevenue + stats.pendingRevenue > 0
              ? `${((stats.paidRevenue / (stats.paidRevenue + stats.pendingRevenue)) * 100).toFixed(1)}%`
              : '0%'}
          </h3>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Clients Bar Chart (Span 2) */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl card-shadow flex flex-col">
          <div className="flex items-center space-x-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
            <Award className="w-5 h-5 text-brand-500" />
            <h3 className="text-lg font-bold">Top Accounts by Paid Billing</h3>
          </div>
          
          <div className="h-80 w-full flex-1">
            {topClients.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">No client revenue recorded.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topClients} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis type="number" style={{ fontSize: '11px', fill: '#94a3b8' }} />
                  <YAxis dataKey="companyName" type="category" style={{ fontSize: '11px', fill: '#94a3b8' }} width={80} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      borderRadius: '12px', 
                      color: '#fff', 
                      border: 'none',
                      fontFamily: 'Outfit'
                    }}
                  />
                  <Bar dataKey="totalPaid" fill="#8b5cf6" radius={[0, 8, 8, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Invoice Status Distribution Pie Chart (Span 1) */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl card-shadow flex flex-col">
          <div className="flex items-center space-x-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
            <PieChartIcon className="w-5 h-5 text-brand-500" />
            <h3 className="text-lg font-bold">Invoice Statuses</h3>
          </div>
          
          <div className="h-64 w-full flex-1 relative">
            {statusData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">No invoice records.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend 
                    verticalAlign="bottom" 
                    iconType="circle"
                    wrapperStyle={{ fontSize: '12px', fontFamily: 'Outfit' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Monthly billing trends */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl card-shadow">
        <div className="flex items-center space-x-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
          <BarChart3 className="w-5 h-5 text-brand-500" />
          <h3 className="text-lg font-bold">Monthly Collections Trend</h3>
        </div>
        <div className="h-80 w-full">
          {monthlyTrend.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400 text-xs">No monthly trends recorded.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="month" style={{ fontSize: '11px', fill: '#94a3b8' }} />
                <YAxis style={{ fontSize: '11px', fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    borderRadius: '12px', 
                    color: '#fff', 
                    border: 'none',
                    fontFamily: 'Outfit'
                  }}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
}
