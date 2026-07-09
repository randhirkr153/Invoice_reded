import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchClientPayments } from '../redux/slices/clientSlice';
import { ShieldAlert, Loader2, CreditCard } from 'lucide-react';

export default function Payments() {
  const dispatch = useDispatch();
  const { payments, loading } = useSelector((state) => state.client);

  useEffect(() => {
    dispatch(fetchClientPayments());
  }, [dispatch]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight font-sans">Payment History</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Trace and review your logs of past settled invoices and transactions.
        </p>
      </div>

      {/* Main card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl card-shadow">
        
        <div className="overflow-x-auto">
          {loading && payments.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <ShieldAlert className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <span>No transactions recorded.</span>
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="px-6 py-4">Receipt Date</th>
                  <th className="px-6 py-4">Invoice Code</th>
                  <th className="px-6 py-4">Settled Amount</th>
                  <th className="px-6 py-4">Method / Status</th>
                  <th className="px-6 py-4">Transaction Ref ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 text-slate-600 dark:text-slate-300">
                    <td className="px-6 py-4 text-xs font-semibold">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      {p.invoice?.invoiceNumber || 'Invoice'}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{p.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-xs font-semibold">
                        <span className="uppercase text-[10px] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded">
                          {p.paymentMethod}
                        </span>
                        <span className="text-emerald-600 uppercase text-[9px] flex items-center">
                          ● {p.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs uppercase tracking-wider">
                      {p.transactionReference || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

    </div>
  );
}
