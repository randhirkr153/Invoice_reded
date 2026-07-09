import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReports } from '../redux/slices/adminSlice';
import { 
  TrendingUp, Clock, AlertTriangle, FileText, CheckCircle2, 
  ArrowUpRight, DollarSign, Calendar 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const dispatch = useDispatch();
  const { reports, loading } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchReports());
  }, [dispatch]);

  const stats = reports?.stats || {
    totalInvoicesCount: 0,
    paidRevenue: 0,
    pendingRevenue: 0,
    paidCount: 0,
    unpaidCount: 0,
    overdueCount: 0
  };

  const chartData = reports?.monthlyRevenueTrend || [];
  const recentInvoices = reports?.recentInvoices || [];
  const recentPayments = reports?.recentPayments || [];

  if (loading && !reports) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/4"></div>
        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
          ))}
        </div>
        {/* Chart Skeleton */}
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight font-sans">Dashboard</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time financial analytics, billing cycles, and invoice statuses.
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 dark:text-slate-400">
          <Calendar className="w-4 h-4 text-slate-400 mr-2" />
          <span>As of {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Revenue Card */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl card-shadow card-shadow-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Paid Revenue</span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold font-sans">₹{stats.paidRevenue.toFixed(2)}</h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-semibold flex items-center">
              <span>{stats.paidCount} fully paid invoices</span>
            </p>
          </div>
        </div>

        {/* Pending Revenue Card */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl card-shadow card-shadow-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Outstanding</span>
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold font-sans">₹{stats.pendingRevenue.toFixed(2)}</h3>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-semibold flex items-center">
              <span>{stats.unpaidCount} unpaid drafts</span>
            </p>
          </div>
        </div>

        {/* Overdue Count Card */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl card-shadow card-shadow-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overdue Bills</span>
            <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold font-sans">{stats.overdueCount}</h3>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-semibold">
              Requires collection follow-up
            </p>
          </div>
        </div>

        {/* Total Invoices count Card */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl card-shadow card-shadow-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Invoices</span>
            <div className="p-2.5 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/30 dark:text-brand-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold font-sans">{stats.totalInvoicesCount}</h3>
            <p className="text-xs text-brand-600 dark:text-brand-400 mt-1 font-semibold">
              Created across database
            </p>
          </div>
        </div>

      </div>

      {/* Main Charts & Revenue Trends */}
      <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl card-shadow">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold">Revenue Trend</h3>
            <p className="text-xs text-slate-400">Monthly revenue changes of paid invoices</p>
          </div>
        </div>
        <div className="h-80 w-full">
          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm">
              <TrendingUp className="w-8 h-8 text-slate-300 mb-2" />
              <span>No paid invoices revenue to graph yet.</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="month" tickLine={false} style={{ fontSize: '12px', fill: '#94a3b8' }} />
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: '12px', fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    borderRadius: '12px', 
                    color: '#fff', 
                    border: 'none',
                    fontFamily: 'Outfit'
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Tables (Side-by-Side) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Invoices */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl card-shadow">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold">Recent Invoices</h3>
              <p className="text-xs text-slate-400">Latest invoices issued to clients</p>
            </div>
            <Link to="/invoices" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center">
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="pb-3">Invoice</th>
                  <th className="pb-3">Client</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">No invoices found.</td>
                  </tr>
                ) : (
                  recentInvoices.map((inv) => (
                    <tr key={inv._id} className="text-slate-600 dark:text-slate-300">
                      <td className="py-3 font-semibold text-slate-950 dark:text-white">{inv.invoiceNumber}</td>
                      <td className="py-3 font-medium truncate max-w-[120px]">{inv.clientDetails?.companyName || inv.client?.name || 'Client'}</td>
                      <td className="py-3 font-semibold">₹{inv.totalAmount.toFixed(2)}</td>
                      <td className="py-3 text-right">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' :
                          inv.status === 'unpaid' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400' :
                          'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl card-shadow">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold">Recent Payments</h3>
              <p className="text-xs text-slate-400">Latest transactions logged in system</p>
            </div>
            <Link to="/payments" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center">
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="pb-3">Invoice</th>
                  <th className="pb-3">Client</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentPayments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">No payments found.</td>
                  </tr>
                ) : (
                  recentPayments.map((p) => (
                    <tr key={p._id} className="text-slate-600 dark:text-slate-300">
                      <td className="py-3 font-semibold text-slate-950 dark:text-white">{p.invoice?.invoiceNumber}</td>
                      <td className="py-3 font-medium truncate max-w-[120px]">{p.client?.name || 'Client'}</td>
                      <td className="py-3 font-semibold text-emerald-600 dark:text-emerald-400">₹{p.amount.toFixed(2)}</td>
                      <td className="py-3 text-right text-xs text-slate-400">
                        {new Date(p.paymentDate).toLocaleDateString()}
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
