import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchClients, addClient, updateClient, deleteClient } from '../redux/slices/adminSlice';
import { 
  Plus, Edit2, Trash2, Search, X, Loader2, 
  Mail, Phone, ShieldAlert, Award 
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';

const clientSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.string().email({ message: 'Enter a valid email address' }),
  password: z.string().optional(),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  gstNumber: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});

export default function Clients() {
  const dispatch = useDispatch();
  const { clients, loading } = useSelector((state) => state.admin);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      address: { street: '', city: '', state: '', zip: '', country: '' }
    }
  });

  useEffect(() => {
    dispatch(fetchClients());
  }, [dispatch]);

  const openAddModal = () => {
    setEditingClient(null);
    reset({
      name: '',
      email: '',
      password: '',
      phone: '',
      companyName: '',
      gstNumber: '',
      address: { street: '', city: '', state: '', zip: '', country: '' }
    });
    setIsModalOpen(true);
  };

  const openEditModal = (client) => {
    setEditingClient(client);
    reset({
      name: client.name,
      email: client.email,
      password: '',
      phone: client.phone || '',
      companyName: client.companyName || '',
      gstNumber: client.gstNumber || '',
      address: {
        street: client.address?.street || '',
        city: client.address?.city || '',
        state: client.address?.state || '',
        zip: client.address?.zip || '',
        country: client.address?.country || '',
      }
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editingClient) {
        // Strip empty password to avoid overwriting password unintentionally
        const clientData = { ...data };
        if (!clientData.password) {
          delete clientData.password;
        }
        await dispatch(updateClient({ id: editingClient._id, clientData })).unwrap();
        toast.success('Client profile updated!');
      } else {
        await dispatch(addClient(data)).unwrap();
        toast.success('New client registered & welcome email sent!');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you absolutely sure you want to delete this client? This will delete all of their invoices and payments.')) {
      try {
        await dispatch(deleteClient(id)).unwrap();
        toast.success('Client database wiped successfully');
      } catch (err) {
        toast.error(err || 'Failed to delete client');
      }
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.companyName && c.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight font-sans">Clients</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create, update, and manage your billing client database records.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center space-x-2 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-colors duration-200 shadow-md shadow-brand-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Search Bar & Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl card-shadow">
        
        {/* Search */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center">
          <div className="relative max-w-md w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder="Search clients by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>
        </div>

        {/* Table list */}
        <div className="overflow-x-auto">
          {loading && clients.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <ShieldAlert className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <span>No clients matching your search criteria.</span>
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="px-6 py-4">Client Detail</th>
                  <th className="px-6 py-4">Company Details</th>
                  <th className="px-6 py-4">Phone / GSTIN</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredClients.map((client) => (
                  <tr key={client._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 text-slate-600 dark:text-slate-300">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 flex items-center justify-center font-bold text-sm">
                          {client.name[0].toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 dark:text-white">{client.name}</span>
                          <span className="text-xs text-slate-400 flex items-center mt-0.5">
                            <Mail className="w-3.5 h-3.5 mr-1" />
                            {client.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{client.companyName || 'Individual Client'}</span>
                        <span className="text-xs text-slate-400 truncate max-w-[180px]">
                          {client.address?.street ? `${client.address.street}, ${client.address.city}` : 'No address config'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-xs">
                        <span className="flex items-center text-slate-700 dark:text-slate-300">
                          <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {client.phone || 'N/A'}
                        </span>
                        <span className="text-slate-400 mt-1 uppercase">GST: {client.gstNumber || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openEditModal(client)}
                          className="p-2 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Profile"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(client._id)}
                          className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Delete Client"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 card-shadow p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold mb-6 font-sans">
              {editingClient ? 'Edit Client Record' : 'Register New Client'}
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Row 1: Name & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Client Name
                  </label>
                  <input
                    type="text"
                    {...register('name')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                  {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                  {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>}
                </div>
              </div>

              {/* Row 2: Password (Optional for edit) & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Password {editingClient ? '(Leave blank to keep current)' : ''}
                  </label>
                  <input
                    type="password"
                    placeholder={editingClient ? '••••••••' : 'Client@123'}
                    {...register('password')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    {...register('phone')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                </div>
              </div>

              {/* Row 3: Company Name & GST Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    {...register('companyName')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    GSTIN / Tax ID
                  </label>
                  <input
                    type="text"
                    {...register('gstNumber')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                </div>
              </div>

              {/* Address details */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Billing Address</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Street Address</label>
                    <input
                      type="text"
                      {...register('address.street')}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">City</label>
                    <input
                      type="text"
                      {...register('address.city')}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">State</label>
                    <input
                      type="text"
                      {...register('address.state')}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">ZIP Code</label>
                    <input
                      type="text"
                      {...register('address.zip')}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Country</label>
                    <input
                      type="text"
                      {...register('address.country')}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-100 dark:border-slate-800">
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
                  Save Client
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
