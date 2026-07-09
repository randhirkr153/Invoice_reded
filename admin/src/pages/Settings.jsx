import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { updateUserProfile } from '../redux/slices/authSlice';
import api from '../services/api';
import toast from 'react-hot-toast';
import { User, Settings as SettingsIcon, ShieldCheck, Loader2 } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
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
  password: z.string().optional(),
});

export default function Settings() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      companyName: user?.companyName || '',
      gstNumber: user?.gstNumber || '',
      address: {
        street: user?.address?.street || '',
        city: user?.address?.city || '',
        state: user?.address?.state || '',
        zip: user?.address?.zip || '',
        country: user?.address?.country || '',
      }
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    // Strip empty password
    const payload = { ...data };
    if (!payload.password) {
      delete payload.password;
    }
    
    try {
      const response = await api.put('/auth/me', payload);
      dispatch(updateUserProfile(response.data.data.user));
      toast.success('Settings and profile updated!');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile settings';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight font-sans">Settings</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Modify your profile attributes, company branding, and security access details.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left tabs selector */}
        <div className="md:col-span-1 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center space-x-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile details</span>
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`flex items-center space-x-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'billing'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>Company details</span>
          </button>
        </div>

        {/* Right form layout */}
        <div className="md:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl card-shadow p-6 md:p-8">
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold border-b border-slate-100 dark:border-slate-800 pb-2">Profile & Security</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Full Name
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
                      Email Address (Read-only)
                    </label>
                    <input
                      type="email"
                      value={user?.email}
                      disabled
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-400 text-sm focus:outline-none cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Change Account Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      {...register('password')}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold border-b border-slate-100 dark:border-slate-800 pb-2">Company Branding & Address</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Organization Name
                    </label>
                    <input
                      type="text"
                      {...register('companyName')}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Organization GSTIN
                    </label>
                    <input
                      type="text"
                      {...register('gstNumber')}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Mailing Address</h4>
                  
                  <div className="grid grid-cols-1 gap-4 mb-4">
                    <div>
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
              </div>
            )}

            {/* Submit */}
            <div className="flex items-center justify-end pt-6 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center space-x-2 py-2.5 px-6 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-md disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Save Settings</span>}
              </button>
            </div>

          </form>

        </div>

      </div>

    </div>
  );
}
