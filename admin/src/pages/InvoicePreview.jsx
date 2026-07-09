import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ChevronLeft, Download, Printer, Loader2, FileText } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { fetchInvoices } from '../redux/slices/adminSlice';

export default function InvoicePreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { invoices } = useSelector((state) => state.admin);

  const [pdfUrl, setPdfUrl] = useState('');
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Find invoice details
  const invoice = invoices.find((inv) => inv._id === id);

  useEffect(() => {
    if (invoices.length === 0) {
      dispatch(fetchInvoices());
    }
  }, [dispatch, invoices.length]);

  // Load PDF Blob Url when ID changes
  useEffect(() => {
    let active = true;
    const fetchBlob = async () => {
      try {
        setLoadingPdf(true);
        setErrorMessage('');
        const response = await api.get(`/admin/invoices/${id}/pdf`, {
          params: { template: 'Template 1', preview: true },
          responseType: 'blob',
        });
        
        if (active) {
          const blob = new Blob([response.data], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          
          // Clean up old URL
          if (pdfUrl) {
            window.URL.revokeObjectURL(pdfUrl);
          }
          
          setPdfUrl(url);
          setLoadingPdf(false);
        }
      } catch (err) {
        if (active) {
          const errMsg = err.response?.data?.message || err.message;
          setErrorMessage(errMsg);
          toast.error(`Failed to render PDF preview: ${errMsg}`);
          setLoadingPdf(false);
        }
      }
    };

    fetchBlob();

    return () => {
      active = false;
    };
  }, [id]);

  // Clean up URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const handlePrint = () => {
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.focus();
      }
    } else {
      toast.error('PDF document is not loaded yet');
    }
  };

  const handleDownload = async () => {
    try {
      toast.loading('Downloading invoice PDF...', { id: 'pdf_dl_loading' });
      const response = await api.get(`/admin/invoices/${id}/pdf`, {
        params: { template: 'Template 1' },
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_${invoice?.invoiceNumber || id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.dismiss('pdf_dl_loading');
      toast.success('Download completed successfully!');
    } catch (err) {
      toast.dismiss('pdf_dl_loading');
      toast.error('Failed to download PDF invoice');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header section with back button and action triggers */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/invoices')}
            className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight font-sans">
              Invoice Preview
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              ID: {invoice?.invoiceNumber || id}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownload}
            className="flex items-center justify-center space-x-2 py-2.5 px-5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-colors duration-200 shadow-md shadow-brand-500/10"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
          
          <button
            onClick={handlePrint}
            className="flex items-center justify-center space-x-2 py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors duration-200 shadow-md shadow-emerald-500/10"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Main preview display area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Full-width PDF embed */}
        <div className="lg:col-span-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 md:p-6 card-shadow flex flex-col justify-between min-h-[650px] relative overflow-hidden">
          {loadingPdf ? (
            <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="text-center space-y-2">
                <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto" />
                <p className="text-sm font-semibold text-slate-500">Generating preview layout...</p>
              </div>
            </div>
          ) : null}

          {pdfUrl ? (
            <iframe
              id="pdf-preview-iframe"
              src={`${pdfUrl}#toolbar=0&navpanes=0`}
              className="w-full h-[700px] rounded-2xl border border-slate-100 dark:border-slate-850"
              title="Invoice PDF Preview"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-[500px] text-slate-400">
              <FileText className="w-12 h-12 mb-2 text-slate-355" />
              <span className="font-semibold text-slate-500">Preview template not available</span>
              {errorMessage && (
                <p className="text-xs text-rose-500 mt-2 bg-rose-50 dark:bg-rose-950/20 px-3 py-1.5 rounded-xl max-w-md text-center border border-rose-100 dark:border-rose-900/30">
                  {errorMessage}
                </p>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
