import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchClientDashboard } from '../redux/slices/clientSlice';
import { 
  FileText, CreditCard, Clock, AlertTriangle, 
  ArrowUpRight, Calendar, CheckCircle2 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const dispatch = useDispatch();
  const { dashboard, loading } = useSelector((state) => state.client);

  useEffect(() => {
    dispatch(fetchClientDashboard());
  }, [dispatch]);

  const stats = dashboard?.stats || {
    totalInvoices: 0,
    paidAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    paidCount: 0,
    unpaidCount: 0,
    overdueCount: 0
  };

  const recentInvoices = dashboard?.recentInvoices || [];
  const recentPayments = dashboard?.recentPayments || [];

  if (loading && !dashboard) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
          ))}
        </div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight font-sans">Billing Overview</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review your statements, download receipts, and settle outstanding bills.
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 dark:text-slate-400">
          <Calendar className="w-4 h-4 text-slate-400 mr-2" />
          <span>Last sync: Today</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Outstanding amount */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl card-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount Due</span>
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold font-sans">₹{stats.pendingAmount.toFixed(2)}</h3>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-semibold">
              {stats.unpaidCount} bills awaiting settlement
            </p>
          </div>
        </div>

        {/* Overdue amount */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl card-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overdue Balance</span>
            <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold font-sans">₹{stats.overdueAmount.toFixed(2)}</h3>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-semibold">
              {stats.overdueCount} invoices past due
            </p>
          </div>
        </div>

        {/* Paid amount */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl card-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Settled</span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold font-sans">₹{stats.paidAmount.toFixed(2)}</h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
              {stats.paidCount} successful payments
            </p>
          </div>
        </div>

        {/* Total Invoices count */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl card-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Bills</span>
            <div className="p-2.5 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/30 dark:text-brand-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold font-sans">{stats.totalInvoices}</h3>
            <p className="text-xs text-brand-600 dark:text-brand-400 mt-1 font-semibold">
              Overall items issued
            </p>
          </div>
        </div>

      </div>

      {/* Recent history panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Invoices */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl card-shadow">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold">Outstanding Invoices</h3>
              <p className="text-xs text-slate-400">Bills requiring your attention</p>
            </div>
            <Link to="/invoices" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center">
              <span>Pay Invoices</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="pb-3">Invoice</th>
                  <th className="pb-3">Due Date</th>
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
                      <td className="py-3 font-medium text-xs">{new Date(inv.dueDate).toLocaleDateString()}</td>
                      <td className="py-3 font-semibold">₹{inv.totalAmount.toFixed(2)}</td>
                      <td className="py-3 text-right">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
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
              <h3 className="text-lg font-bold">Payments Cleared</h3>
              <p className="text-xs text-slate-400">Review your past transaction history</p>
            </div>
            <Link to="/payments" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center">
              <span>View History</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="pb-3">Invoice</th>
                  <th className="pb-3">Receipt Date</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3 text-right">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentPayments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">No transactions recorded.</td>
                  </tr>
                ) : (
                  recentPayments.map((p) => (
                    <tr key={p._id} className="text-slate-600 dark:text-slate-300">
                      <td className="py-3 font-semibold text-slate-950 dark:text-white">
                        {p.invoice?.invoiceNumber}
                      </td>
                      <td className="py-3 font-medium text-xs">{new Date(p.paymentDate).toLocaleDateString()}</td>
                      <td className="py-3 font-semibold text-emerald-600 dark:text-emerald-400">₹{p.amount.toFixed(2)}</td>
                      <td className="py-3 text-right text-xs uppercase text-slate-400">
                        {p.paymentMethod}
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
