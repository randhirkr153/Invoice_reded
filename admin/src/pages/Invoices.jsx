import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  fetchInvoices, fetchClients, fetchProducts, 
  addInvoice, deleteInvoice, updateInvoice 
} from '../redux/slices/adminSlice';
import { 
  Plus, Trash2, Search, X, Loader2, 
  Download, Send, Eye, FileText, ChevronLeft,
  Calendar, Check, AlertCircle, RefreshCw, Pencil, CreditCard, MoreHorizontal
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Invoices() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { invoices, clients, products, loading } = useSelector((state) => state.admin);
  const { user: adminUser } = useSelector((state) => state.auth);
  
  // UI views: 'list' or 'create'
  const [view, setView] = useState('list');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  
  // Custom edit states & action menu states
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    const id = params.get('id');
    
    if (action === 'create') {
      setEditingInvoiceId(null);
      setSelectedClient('');
      setDueDate('');
      setDiscountRate(0);
      setNotes('');
      setTerms('');
      setItems([{ product: '', name: '', price: '', quantity: '1', taxRate: '18' }]);
      setView('create');
    } else if (action === 'edit' && id) {
      setEditingInvoiceId(id);
      const inv = invoices.find(i => i._id === id);
      if (inv) {
        setSelectedClient(inv.client?._id || inv.client || '');
        setDueDate(inv.dueDate ? inv.dueDate.split('T')[0] : '');
        setDiscountRate(inv.discountRate || 0);
        setNotes(inv.notes || '');
        setTerms(inv.terms || '');
        setItems(inv.items.map(item => ({
          product: item.product?._id || item.product || '',
          name: item.name || '',
          price: item.price !== undefined ? item.price.toString() : '',
          quantity: item.quantity !== undefined ? item.quantity.toString() : '1',
          taxRate: item.taxRate !== undefined ? item.taxRate.toString() : '18',
          hsnCode: item.hsnCode || ''
        })));
      }
      setView('create');
    } else {
      setEditingInvoiceId(null);
      setView('list');
    }
  }, [location.search, invoices]);

  // Creation form states
  const [selectedClient, setSelectedClient] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [discountRate, setDiscountRate] = useState(0);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [items, setItems] = useState([{ product: '', name: '', price: '', quantity: '1', taxRate: '18', hsnCode: '' }]);

  useEffect(() => {
    dispatch(fetchInvoices());
    if (view === 'create') {
      dispatch(fetchClients());
      dispatch(fetchProducts());
    }
  }, [dispatch, view]);

  // Calculations for composer
  const calculateTotals = () => {
    let subtotal = 0;
    let taxTotal = 0;
    
    items.forEach((item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;
      const taxRate = Number(item.taxRate) || 0;
      
      const itemSubtotal = price * quantity;
      const itemTaxAmount = itemSubtotal * (taxRate / 100);
      
      subtotal += itemSubtotal;
      taxTotal += itemTaxAmount;
    });

    const dRate = Number(discountRate) || 0;
    const discountAmount = subtotal * (dRate / 100);
    const totalAmount = (subtotal - discountAmount) + taxTotal;

    return {
      subtotal,
      discountAmount,
      taxTotal,
      totalAmount
    };
  };

  const handleItemProductChange = (index, productId) => {
    const prod = products.find(p => p._id === productId);
    if (!prod) return;

    const newItems = [...items];
    newItems[index] = {
      product: prod._id,
      name: prod.name,
      price: prod.price,
      quantity: newItems[index].quantity || 1,
      taxRate: prod.taxRate || 18,
      hsnCode: prod.hsnCode || ''
    };
    setItems(newItems);
  };

  const handleItemFieldChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addInvoiceItemRow = () => {
    setItems([...items, { product: '', name: '', price: '', quantity: '1', taxRate: '18', hsnCode: '' }]);
  };

  const removeInvoiceItemRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSaveInvoice = async (status = 'unpaid') => {
    if (!selectedClient) {
      toast.error('Please select a client');
      return;
    }
    if (!dueDate) {
      toast.error('Please specify a due date');
      return;
    }
    const invalidItems = items.some(item => !item.name?.trim() || item.quantity <= 0);
    if (invalidItems) {
      toast.error('All rows must have an item description and positive quantities');
      return;
    }

    const payload = {
      client: selectedClient,
      dueDate,
      discountRate,
      notes,
      terms,
      status,
      items: items.map(i => ({
        product: i.product || undefined,
        name: i.name,
        quantity: Number(i.quantity),
        price: Number(i.price),
        taxRate: Number(i.taxRate),
        hsnCode: i.hsnCode || ''
      }))
    };

    try {
      if (editingInvoiceId) {
        await dispatch(updateInvoice({ id: editingInvoiceId, invoiceData: payload })).unwrap();
        toast.success('Invoice updated successfully');
      } else {
        await dispatch(addInvoice(payload)).unwrap();
        toast.success(status === 'paid' ? 'Invoice created & marked as PAID' : 'Invoice created & sent to client!');
      }
      navigate('/invoices');
      setSelectedClient('');
      setDueDate('');
      setDiscountRate(0);
      setNotes('');
      setTerms('');
      setItems([{ product: '', name: '', price: '', quantity: '1', taxRate: '18' }]);
    } catch (err) {
      toast.error(err || 'Failed to save invoice');
    }
  };

  const handleDownloadPDF = async (invoiceId, invoiceNumber) => {
    try {
      toast.loading('Generating invoice PDF...', { id: 'pdf_loading' });
      
      // Fetch file stream from endpoint with responseType blob
      const response = await api.get(`/admin/invoices/${invoiceId}/pdf`, {
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

  const handleSendEmail = async (invoiceId) => {
    try {
      toast.loading('Sending invoice email...', { id: 'email_loading' });
      await api.post(`/admin/invoices/${invoiceId}/send`);
      toast.dismiss('email_loading');
      toast.success('Invoice notification email dispatched!');
    } catch (err) {
      toast.dismiss('email_loading');
      toast.error('Failed to dispatch notification email');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this invoice? All logged payment records will also be erased.')) {
      try {
        await dispatch(deleteInvoice(id)).unwrap();
        toast.success('Invoice deleted');
      } catch (err) {
        toast.error(err || 'Failed to delete invoice');
      }
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      inv.clientDetails?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      inv.client?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === '' || inv.status === statusFilter;

    const invDate = new Date(inv.issueDate);
    const matchesMonth = monthFilter === '' || invDate.getMonth() === Number(monthFilter);
    const matchesYear = yearFilter === '' || invDate.getFullYear() === Number(yearFilter);
    
    return matchesSearch && matchesStatus && matchesMonth && matchesYear;
  });

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      
      {view === 'list' ? (
        <>
          {/* Header section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight font-sans">Invoices</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Track status cycles, download PDFs, print invoices, and email bills to clients.
              </p>
            </div>
            <button
              onClick={() => navigate('/invoices?action=create')}
              className="inline-flex items-center justify-center space-x-2 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-colors duration-200 shadow-md shadow-brand-500/10"
            >
              <Plus className="w-4 h-4" />
              <span>Create Invoice</span>
            </button>
          </div>

          {/* Invoices List Grid */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl card-shadow">
            
            {/* Search and Filters */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="relative max-w-md w-full">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Search className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  placeholder="Search invoices by code or client name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                />
              </div>

              {/* Select Dropdown Filters */}
              <div className="grid grid-cols-3 gap-2 w-full lg:w-auto lg:min-w-[420px]">
                
                {/* Status Dropdown */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-slate-700 dark:text-slate-300"
                >
                  <option value="" className="dark:bg-slate-900">All Status</option>
                  <option value="paid" className="dark:bg-slate-900">Paid</option>
                  <option value="unpaid" className="dark:bg-slate-900">Unpaid</option>
                  <option value="overdue" className="dark:bg-slate-900">Overdue</option>
                  <option value="draft" className="dark:bg-slate-900">Draft</option>
                </select>

                {/* Month Dropdown */}
                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-slate-700 dark:text-slate-300"
                >
                  <option value="" className="dark:bg-slate-900">All Months</option>
                  <option value="0" className="dark:bg-slate-900">January</option>
                  <option value="1" className="dark:bg-slate-900">February</option>
                  <option value="2" className="dark:bg-slate-900">March</option>
                  <option value="3" className="dark:bg-slate-900">April</option>
                  <option value="4" className="dark:bg-slate-900">May</option>
                  <option value="5" className="dark:bg-slate-900">June</option>
                  <option value="6" className="dark:bg-slate-900">July</option>
                  <option value="7" className="dark:bg-slate-900">August</option>
                  <option value="8" className="dark:bg-slate-900">September</option>
                  <option value="9" className="dark:bg-slate-900">October</option>
                  <option value="10" className="dark:bg-slate-900">November</option>
                  <option value="11" className="dark:bg-slate-900">December</option>
                </select>

                {/* Year Dropdown */}
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-slate-700 dark:text-slate-300"
                >
                  <option value="" className="dark:bg-slate-900">All Years</option>
                  <option value="2026" className="dark:bg-slate-900">2026</option>
                  <option value="2025" className="dark:bg-slate-900">2025</option>
                  <option value="2024" className="dark:bg-slate-900">2024</option>
                  <option value="2023" className="dark:bg-slate-900">2023</option>
                </select>

              </div>
            </div>

            {/* Invoices Table */}
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
                      <th className="px-6 py-4">Client / Org</th>
                      <th className="px-6 py-4">Issue Date</th>
                      <th className="px-6 py-4">Due Date</th>
                      <th className="px-6 py-4">Total Amount</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredInvoices.map((inv) => (
                      <tr key={inv._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 text-slate-600 dark:text-slate-300">
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                          {inv.invoiceNumber}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {inv.clientDetails?.companyName || inv.clientDetails?.name || 'Individual'}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                              Contact: {inv.clientDetails?.name || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium">
                          {new Date(inv.issueDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium">
                          {new Date(inv.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                          ₹{inv.totalAmount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                            inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' :
                            inv.status === 'unpaid' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400' :
                            inv.status === 'overdue' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right relative">
                          <div className="flex items-center justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === inv._id ? null : inv._id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Actions"
                            >
                              <MoreHorizontal className="w-5 h-5" />
                            </button>

                            {activeMenuId === inv._id && (
                              <>
                                <div 
                                  className="fixed inset-0 z-10" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(null);
                                  }}
                                />
                                
                                <div className="absolute right-6 mt-2 w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 text-left z-20 font-sans">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuId(null);
                                      navigate(`/invoices/${inv._id}`);
                                    }}
                                    className="flex items-center space-x-2.5 w-full px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                                  >
                                    <Eye className="w-4 h-4 text-slate-400" />
                                    <span>View Invoice</span>
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuId(null);
                                      navigate('/payments');
                                    }}
                                    className="flex items-center space-x-2.5 w-full px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                                  >
                                    <CreditCard className="w-4 h-4 text-slate-400" />
                                    <span>Manage Payments</span>
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuId(null);
                                      navigate(`/invoices?action=edit&id=${inv._id}`);
                                    }}
                                    className="flex items-center space-x-2.5 w-full px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                                  >
                                    <Pencil className="w-4 h-4 text-slate-400" />
                                    <span>Edit Invoice</span>
                                  </button>

                                  <div className="border-t border-slate-100 dark:border-slate-800/60 my-1" />

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuId(null);
                                      handleDelete(inv._id);
                                    }}
                                    className="flex items-center space-x-2.5 w-full px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4 text-rose-500" />
                                    <span>Delete Invoice</span>
                                  </button>
                                </div>
                              </>
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
        </>
      ) : (
        /* Invoice Composer View */
        <div className="space-y-6 max-w-5xl mx-auto">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <button
              onClick={() => navigate('/invoices')}
              className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 self-start"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Invoice Registry</span>
            </button>
            <h2 className="text-xl md:text-2xl font-bold">{editingInvoiceId ? 'Edit Invoice Composer' : 'New Invoice Composer'}</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Panel: Client details and line items */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Header card */}
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl card-shadow space-y-4">
                <h3 className="text-lg font-bold border-b border-slate-100 dark:border-slate-800 pb-2">Invoice Attributes</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Bill To Client</label>
                    <select
                      value={selectedClient}
                      onChange={(e) => setSelectedClient(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    >
                      <option value="" className="dark:bg-slate-900">-- Select Client --</option>
                      {clients.map(c => (
                        <option key={c._id} value={c._id} className="dark:bg-slate-900">
                          {c.companyName ? `${c.companyName} (${c.name})` : c.name}
                        </option>
                      ))}
                    </select>
                    {(() => {
                      if (!selectedClient) return null;
                      const clientObj = clients.find(c => c._id === selectedClient);
                      if (!clientObj) return null;
                      
                      const adminState = adminUser?.address?.state || 'Not set';
                      const clientState = clientObj.address?.state || 'Not set';
                      const isSameState = adminState.trim().toUpperCase() === clientState.trim().toUpperCase() && adminState !== 'Not set';
                      
                      return (
                        <div className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Transaction: <span className="text-slate-700 dark:text-slate-300">{adminState}</span> (You) → <span className="text-slate-700 dark:text-slate-300">{clientState}</span> (Client)
                          <span className={`ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isSameState ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' :
                            'bg-brand-50 text-brand-700 dark:bg-brand-950/20 dark:text-brand-400'
                          }`}>
                            {isSameState ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)'}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Due Date</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <Calendar className="w-4 h-4" />
                      </span>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Card */}
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl card-shadow space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h3 className="text-lg font-bold">Line Items</h3>
                  <button
                    type="button"
                    onClick={addInvoiceItemRow}
                    className="inline-flex items-center text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>Add Item Row</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="relative p-4 md:p-5 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/60 rounded-2xl space-y-3">
                      
                      {/* Row 1: Product Selection & Item Title */}
                      <div className="grid grid-cols-12 gap-3 items-end">
                        {/* Select Catalog Product (Optional) */}
                        <div className="col-span-12 md:col-span-4">
                          <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Select Catalog Product (Optional)</label>
                          <select
                            value={item.product || ''}
                            onChange={(e) => handleItemProductChange(index, e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-sans text-slate-700 dark:text-slate-300"
                          >
                            <option value="" className="dark:bg-slate-900">-- Choose Product --</option>
                            {products.map(p => (
                              <option key={p._id} value={p._id} className="dark:bg-slate-900">
                                {p.name} ({p.sku})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Item Description / Title */}
                        <div className="col-span-11 md:col-span-7">
                          <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Item Description / Title</label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemFieldChange(index, 'name', e.target.value)}
                            placeholder="E.g. Consulting Service, Software License..."
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                          />
                        </div>

                        {/* Delete row button on mobile */}
                        <div className="col-span-1 md:hidden flex justify-end pb-1.5">
                          <button
                            type="button"
                            onClick={() => removeInvoiceItemRow(index)}
                            className="p-2 text-rose-500 hover:text-rose-600 rounded-lg bg-rose-50 dark:bg-rose-950/20"
                            disabled={items.length === 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Row 2: HSN/SAC, Qty, Price, GST %, Delete */}
                      <div className="grid grid-cols-12 gap-3 items-end">
                        {/* HSN/SAC Code */}
                        <div className="col-span-6 md:col-span-3">
                          <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">HSN / SAC Code</label>
                          <input
                            type="text"
                            value={item.hsnCode}
                            onChange={(e) => handleItemFieldChange(index, 'hsnCode', e.target.value)}
                            placeholder="E.g. 998311"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                          />
                        </div>

                        {/* Quantity */}
                        <div className="col-span-6 md:col-span-2">
                          <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Qty</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemFieldChange(index, 'quantity', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                          />
                        </div>

                        {/* Unit Price */}
                        <div className="col-span-6 md:col-span-3">
                          <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Price (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => handleItemFieldChange(index, 'price', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                          />
                        </div>

                        {/* GST Rate */}
                        <div className="col-span-6 md:col-span-3">
                          <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">GST %</label>
                          <input
                            type="number"
                            value={item.taxRate}
                            onChange={(e) => handleItemFieldChange(index, 'taxRate', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                          />
                        </div>

                        {/* Delete row button on desktop */}
                        <div className="hidden md:flex md:col-span-1 justify-center pb-1.5">
                          <button
                            type="button"
                            onClick={() => removeInvoiceItemRow(index)}
                            className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                            disabled={items.length === 1}
                            title="Remove Row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* Notes and Terms card */}
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl card-shadow grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Invoice Notes (Visible to Client)</label>
                  <textarea
                    rows="3"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter any payment details or thank you messages..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Terms & Conditions</label>
                  <textarea
                    rows="3"
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    placeholder="E.g., Payment within 15 days of issue date..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none resize-none"
                  />
                </div>
              </div>

            </div>

            {/* Right Panel: Totals summary and save triggers */}
            <div className="space-y-6">
              
              {/* Calculations Card */}
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl card-shadow space-y-4">
                <h3 className="text-lg font-bold border-b border-slate-100 dark:border-slate-800 pb-2">Pricing summary</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-semibold">₹{totals.subtotal.toFixed(2)}</span>
                  </div>
                  
                  {/* Discount input */}
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Discount Rate (%):</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discountRate}
                      onChange={(e) => setDiscountRate(Number(e.target.value))}
                      className="w-20 px-2 py-1 text-right border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-xs"
                    />
                  </div>

                  {totals.discountAmount > 0 && (
                    <div className="flex justify-between text-rose-500 font-semibold">
                      <span>Discount:</span>
                      <span>-₹{totals.discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  {(() => {
                    const clientObj = clients.find(c => c._id === selectedClient);
                    if (!selectedClient || !clientObj || !clientObj.address?.state || !adminUser?.address?.state) {
                      return (
                        <div className="flex justify-between text-slate-500 dark:text-slate-400">
                          <span>GST Tax Total:</span>
                          <span className="font-semibold">₹{totals.taxTotal.toFixed(2)}</span>
                        </div>
                      );
                    }
                    const adminState = (adminUser.address.state || '').trim().toUpperCase();
                    const clientState = (clientObj.address.state || '').trim().toUpperCase();
                    
                    const taxRate = items[0]?.taxRate || 18;

                    if (adminState === clientState) {
                      const halfTax = totals.taxTotal / 2;
                      const halfRate = taxRate / 2;
                      return (
                        <>
                          <div className="flex justify-between text-slate-500 dark:text-slate-400 text-xs">
                            <span>CGST ({halfRate}%):</span>
                            <span className="font-semibold">₹{halfTax.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-slate-500 dark:text-slate-400 text-xs">
                            <span>SGST ({halfRate}%):</span>
                            <span className="font-semibold">₹{halfTax.toFixed(2)}</span>
                          </div>
                        </>
                      );
                    } else {
                      return (
                        <div className="flex justify-between text-slate-500 dark:text-slate-400 text-xs">
                          <span>IGST ({taxRate}%):</span>
                          <span className="font-semibold">₹{totals.taxTotal.toFixed(2)}</span>
                        </div>
                      );
                    }
                  })()}

                  <hr className="border-slate-100 dark:border-slate-800 my-2" />

                  <div className="flex justify-between text-brand-600 dark:text-brand-400 text-lg font-bold">
                    <span>Grand Total:</span>
                    <span>₹{totals.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Actions panel */}
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl card-shadow space-y-3">
                <button
                  type="button"
                  onClick={() => handleSaveInvoice(editingInvoiceId ? undefined : 'unpaid')}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-brand-500/10"
                >
                  <Send className="w-4 h-4" />
                  <span>{editingInvoiceId ? 'Save & Apply Updates' : 'Issue & Email Invoice'}</span>
                </button>

                {!editingInvoiceId && (
                  <button
                    type="button"
                    onClick={() => handleSaveInvoice('paid')}
                    className="w-full flex items-center justify-center space-x-2 py-3 px-4 border border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-xl text-sm font-semibold transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>Issue as PAID</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleSaveInvoice(editingInvoiceId ? undefined : 'draft')}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl text-sm font-semibold transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>{editingInvoiceId ? 'Save as Draft Update' : 'Save as Draft'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/invoices')}
                  className="w-full py-2 px-4 text-center text-xs text-slate-400 hover:text-slate-600"
                >
                  Discard Changes
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
