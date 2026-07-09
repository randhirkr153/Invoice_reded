import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPayments, fetchInvoices, addPayment } from '../redux/slices/adminSlice';
import { 
  Plus, Search, X, Loader2, 
  CreditCard, ShieldAlert, DollarSign, Calendar, FileText 
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';

const paymentSchema = z.object({
  invoice: z.string().min(1, { message: 'Invoice is required' }),
  amount: z.preprocess(
    (val) => Number(val),
    z.number().min(0.01, { message: 'Amount must be greater than zero' })
  ),
  paymentMethod: z.string().min(1, { message: 'Payment method is required' }),
  transactionReference: z.string().optional(),
  paymentDate: z.string().optional(),
});

export default function Payments() {
  const dispatch = useDispatch();
  const { payments, invoices, loading } = useSelector((state) => state.admin);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(paymentSchema),
  });

  useEffect(() => {
    dispatch(fetchPayments());
    if (isModalOpen) {
      dispatch(fetchInvoices());
    }
  }, [dispatch, isModalOpen]);

  const openAddModal = () => {
    reset({
      invoice: '',
      amount: 0,
      paymentMethod: 'bank_transfer',
      transactionReference: '',
      paymentDate: new Date().toISOString().substring(0, 10),
    });
    setIsModalOpen(true);
  };

  // When user selects invoice, pre-fill outstanding amount
  const handleInvoiceChange = (invoiceId) => {
    const selectedInv = invoices.find(inv => inv._id === invoiceId);
    if (selectedInv) {
      setValue('amount', selectedInv.totalAmount);
    }
  };

  const onSubmit = async (data) => {
    try {
      await dispatch(addPayment(data)).unwrap();
      toast.success('Payment recorded successfully! Invoice status set to Paid.');
      setIsModalOpen(false);
      dispatch(fetchPayments()); // reload payments log
    } catch (err) {
      toast.error(err || 'Recording payment failed');
    }
  };

  const filteredPayments = payments.filter(p => 
    p.invoice?.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.transactionReference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight font-sans">Payments</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Monitor and record client payment receipts and transaction records.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center space-x-2 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-colors duration-200 shadow-md shadow-brand-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Record Offline Payment</span>
        </button>
      </div>

      {/* List Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl card-shadow">
        
        {/* Search */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center">
          <div className="relative max-w-md w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder="Search payments by invoice code, client name, txn ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>
        </div>

        {/* Table list */}
        <div className="overflow-x-auto">
          {loading && payments.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <ShieldAlert className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <span>No transactions logged.</span>
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="px-6 py-4">Receipt Date</th>
                  <th className="px-6 py-4">Invoice Code</th>
                  <th className="px-6 py-4">Client Detail</th>
                  <th className="px-6 py-4">Amount Paid</th>
                  <th className="px-6 py-4">Method / TXN ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPayments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 text-slate-600 dark:text-slate-300">
                    <td className="px-6 py-4 text-xs font-semibold">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      {p.invoice?.invoiceNumber || 'Deleted Invoice'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {p.client?.companyName || p.client?.name || 'Client'}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                          Contact: {p.client?.name || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{p.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-xs">
                        <span className="font-medium text-slate-700 dark:text-slate-300 uppercase">
                          {p.paymentMethod.replace('_', ' ')}
                        </span>
                        <span className="text-slate-400 mt-1 font-mono text-[10px] uppercase">
                          ID: {p.transactionReference || 'N/A'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 card-shadow p-6 md:p-8">
            
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold mb-6 font-sans">
              Record Manual Payment
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Select Invoice
                </label>
                <select
                  {...register('invoice')}
                  onChange={(e) => handleInvoiceChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                >
                  <option value="" className="dark:bg-slate-900">-- Choose Invoice --</option>
                  {invoices
                    .filter(inv => inv.status !== 'paid')
                    .map(inv => (
                      <option key={inv._id} value={inv._id} className="dark:bg-slate-900">
                        {inv.invoiceNumber} - {inv.clientDetails?.companyName || inv.clientDetails?.name} (₹{inv.totalAmount.toFixed(2)})
                      </option>
                    ))}
                </select>
                {errors.invoice && <p className="mt-1 text-xs text-rose-500">{errors.invoice.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Amount Received (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('amount')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                  {errors.amount && <p className="mt-1 text-xs text-rose-500">{errors.amount.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    {...register('paymentDate')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Payment Method
                </label>
                <select
                  {...register('paymentMethod')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                >
                  <option value="bank_transfer" className="dark:bg-slate-900">Bank Transfer</option>
                  <option value="cash" className="dark:bg-slate-900">Cash</option>
                  <option value="card" className="dark:bg-slate-900">Credit/Debit Card</option>
                  <option value="upi" className="dark:bg-slate-900">UPI / Mobile Wallet</option>
                  <option value="other" className="dark:bg-slate-900">Other</option>
                </select>
                {errors.paymentMethod && <p className="mt-1 text-xs text-rose-500">{errors.paymentMethod.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Transaction Reference (Txn ID / Note)
                </label>
                <input
                  type="text"
                  placeholder="E.g., CHQ-998811, TXN-9987"
                  {...register('transactionReference')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Log Transaction
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
