import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, addProduct, updateProduct, deleteProduct } from '../redux/slices/adminSlice';
import { 
  Plus, Edit2, Trash2, Search, X, Loader2, 
  ShoppingBag, ShieldAlert, DollarSign, Percent 
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';

const productSchema = z.object({
  name: z.string().min(1, { message: 'Product name is required' }),
  sku: z.string().min(1, { message: 'SKU is required' }),
  price: z.preprocess(
    (val) => Number(val),
    z.number().min(0, { message: 'Price cannot be negative' })
  ),
  taxRate: z.preprocess(
    (val) => (val === '' ? 18 : Number(val)),
    z.number().min(0, { message: 'Tax rate cannot be negative' })
  ),
  hsnCode: z.string().optional(),
  description: z.string().optional(),
});

export default function Products() {
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.admin);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(productSchema),
  });

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const openAddModal = () => {
    setEditingProduct(null);
    reset({
      name: '',
      sku: '',
      price: 0,
      taxRate: 18,
      hsnCode: '',
      description: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    reset({
      name: product.name,
      sku: product.sku,
      price: product.price,
      taxRate: product.taxRate,
      hsnCode: product.hsnCode || '',
      description: product.description || ''
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editingProduct) {
        await dispatch(updateProduct({ id: editingProduct._id, productData: data })).unwrap();
        toast.success('Product details updated!');
      } else {
        await dispatch(addProduct(data)).unwrap();
        toast.success('Product catalog item created!');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await dispatch(deleteProduct(id)).unwrap();
        toast.success('Product catalog item deleted');
      } catch (err) {
        toast.error(err || 'Failed to delete product');
      }
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight font-sans">Products</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage your service catalogs, item pricing, and standard GST tax rates.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center space-x-2 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-colors duration-200 shadow-md shadow-brand-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Search & Grid Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl card-shadow">
        
        {/* Search */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center">
          <div className="relative max-w-md w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder="Search products by SKU or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>
        </div>

        {/* Table list */}
        <div className="overflow-x-auto">
          {loading && products.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <ShieldAlert className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <span>No products found in catalog.</span>
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4">SKU / Code</th>
                  <th className="px-6 py-4">HSN / SAC</th>
                  <th className="px-6 py-4">Unit Price</th>
                  <th className="px-6 py-4">GST Rate</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 text-slate-600 dark:text-slate-300">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 dark:text-white">{product.name}</span>
                        <span className="text-xs text-slate-400 max-w-[240px] truncate">{product.description || 'No description provided'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs uppercase tracking-wider">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {product.hsnCode || '-'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      ₹{product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                        {product.taxRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-2 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Delete Product"
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
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 card-shadow p-6 md:p-8">
            
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold mb-6 font-sans">
              {editingProduct ? 'Edit Catalog Item' : 'Add Catalog Product'}
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  placeholder="Software License, Consulting Hour..."
                  {...register('name')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                />
                {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    placeholder="SKU-XXXX"
                    {...register('sku')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                  {errors.sku && <p className="mt-1 text-xs text-rose-500">{errors.sku.message}</p>}
                </div>
                <div>
                   <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                     Unit Price (₹)
                   </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="99.99"
                    {...register('price')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                  {errors.price && <p className="mt-1 text-xs text-rose-500">{errors.price.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    GST Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    placeholder="18"
                    {...register('taxRate')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                  {errors.taxRate && <p className="mt-1 text-xs text-rose-500">{errors.taxRate.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    HSN / SAC Code
                  </label>
                  <input
                    type="text"
                    placeholder="E.g. 998311"
                    {...register('hsnCode')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                  {errors.hsnCode && <p className="mt-1 text-xs text-rose-500">{errors.hsnCode.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Product Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Provide any item details..."
                  {...register('description')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all resize-none"
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
                  Save Product
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
