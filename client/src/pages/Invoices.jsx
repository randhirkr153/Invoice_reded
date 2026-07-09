import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchClientInvoices, payClientInvoice } from '../redux/slices/clientSlice';
import { 
  FileText, Download, CreditCard, Search, X, Loader2, 
  Check, Calendar, ArrowRight, ShieldCheck, DollarSign
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Invoices() {
  const dispatch = useDispatch();
  const { invoices, loading } = useSelector((state) => state.client);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Payment checkout modal states
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchClientInvoices(statusFilter));
  }, [dispatch, statusFilter]);

  const openPaymentModal = (invoice) => {
    setPayingInvoice(invoice);
    setPaymentMethod('card');
    setIsPayModalOpen(true);
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!payingInvoice) return;

    setPaymentLoading(true);
    try {
      const payload = {
        invoice: payingInvoice._id,
        paymentMethod,
        amount: payingInvoice.totalAmount,
        transactionReference: `TXN-HUB-${Date.now()}`
      };
      
      await dispatch(payClientInvoice(payload)).unwrap();
      toast.success(`Payment of ₹${payingInvoice.totalAmount.toFixed(2)} mock processed!`);
      setIsPayModalOpen(false);
      dispatch(fetchClientInvoices(statusFilter)); // refresh list
    } catch (err) {
      toast.error(err || 'Checkout processing failed');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleDownloadPDF = async (invoiceId, invoiceNumber) => {
    try {
      toast.loading('Generating invoice PDF...', { id: 'pdf_loading' });
      
      // Fetch file stream from endpoint with responseType blob
      const response = await api.get(`/client/invoices/${invoiceId}/pdf`, {
        responseType: 'blob'
      });
      
      // Create local URL for the PDF blob
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Create temporary a tag to trigger file download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.dismiss('pdf_loading');
      toast.success(`PDF downloaded for ${invoiceNumber}`);
    } catch (err) {
      toast.dismiss('pdf_loading');
      toast.error('Failed to generate PDF');
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight font-sans">My Invoices</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Review, print, download, or complete payments on your issued billing statements.
        </p>
      </div>

      {/* Main invoices grid card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl card-shadow">
        
        {/* Search & Tabs */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative max-w-md w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder="Search invoices by invoice number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { value: '', label: 'All Bills' },
              { value: 'paid', label: 'Paid' },
              { value: 'unpaid', label: 'Unpaid' },
              { value: 'overdue', label: 'Overdue' },
            ].map((status) => (
              <button
                key={status.value}
                onClick={() => setStatusFilter(status.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === status.value
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* Invoices List Table */}
        <div className="overflow-x-auto">
          {loading && invoices.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <span>No invoices found.</span>
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="px-6 py-4">Invoice No</th>
                  <th className="px-6 py-4">Billing Date</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredInvoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 text-slate-600 dark:text-slate-300">
                    <td className="px-6 py-4 font-semibold text-slate-950 dark:text-white">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold">
                      {new Date(inv.issueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-950 dark:text-white">
                      ₹{inv.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' :
                        inv.status === 'unpaid' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400' :
                        'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleDownloadPDF(inv._id, inv.invoiceNumber)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold rounded-lg transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                        
                        {inv.status !== 'paid' && (
                          <button
                            onClick={() => openPaymentModal(inv)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm shadow-brand-500/10"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Pay Bill</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* Pay Invoice Checkout Drawer Modal */}
      {isPayModalOpen && payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 card-shadow p-6 md:p-8">
            
            <button
              onClick={() => setIsPayModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Settle Invoice Balance</span>
              <h3 className="text-2xl font-extrabold text-brand-600 dark:text-brand-400 mt-1 font-sans">
                ₹{payingInvoice.totalAmount.toFixed(2)}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Invoice: {payingInvoice.invoiceNumber}</p>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-5">
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Select Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'card', label: 'Credit Card' },
                    { value: 'upi', label: 'UPI Wallet' },
                    { value: 'bank_transfer', label: 'Bank Net' },
                  ].map(method => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setPaymentMethod(method.value)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                        paymentMethod === method.value
                          ? 'border-brand-600 bg-brand-50/50 text-brand-600 dark:border-brand-500 dark:bg-brand-950/20 dark:text-brand-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Sub-forms based on payment method */}
              {paymentMethod === 'card' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Card Number</label>
                    <input
                      type="text"
                      placeholder="•••• •••• •••• ••••"
                      required
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-xs focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        required
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">CVV</label>
                      <input
                        type="password"
                        placeholder="•••"
                        maxLength="3"
                        required
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'upi' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">UPI Address (VPA)</label>
                  <input
                    type="text"
                    placeholder="username@upi"
                    required
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-xs focus:outline-none"
                  />
                </div>
              )}

              {paymentMethod === 'bank_transfer' && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 leading-relaxed space-y-1">
                  <p><strong>Bank:</strong> Billionaire Business Bank</p>
                  <p><strong>A/C No:</strong> 99018872615</p>
                  <p><strong>IFSC:</strong> BILL00021</p>
                  <p className="text-[10px] text-slate-400 italic mt-1">Net Banking credentials will be requested in mock gateway screen.</p>
                </div>
              )}

              <div className="flex items-center space-x-2 text-[10px] text-slate-400 leading-none py-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Mock Transaction secured by End-to-End JWT authentication.</span>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="py-2 px-4 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentLoading}
                  className="inline-flex items-center space-x-1.5 py-2 px-5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  {paymentLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <span>Authorize Payment</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
