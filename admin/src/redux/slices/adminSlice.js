import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async Thunks
export const fetchClients = createAsyncThunk('admin/fetchClients', async (_, thunkAPI) => {
  try {
    const response = await api.get('/admin/clients');
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch clients');
  }
});

export const addClient = createAsyncThunk('admin/addClient', async (clientData, thunkAPI) => {
  try {
    const response = await api.post('/admin/clients', clientData);
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to add client');
  }
});

export const updateClient = createAsyncThunk('admin/updateClient', async ({ id, clientData }, thunkAPI) => {
  try {
    const response = await api.put(`/admin/clients/${id}`, clientData);
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update client');
  }
});

export const deleteClient = createAsyncThunk('admin/deleteClient', async (id, thunkAPI) => {
  try {
    await api.delete(`/admin/clients/${id}`);
    return id;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete client');
  }
});

// Products
export const fetchProducts = createAsyncThunk('admin/fetchProducts', async (_, thunkAPI) => {
  try {
    const response = await api.get('/admin/products');
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
  }
});

export const addProduct = createAsyncThunk('admin/addProduct', async (productData, thunkAPI) => {
  try {
    const response = await api.post('/admin/products', productData);
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to add product');
  }
});

export const updateProduct = createAsyncThunk('admin/updateProduct', async ({ id, productData }, thunkAPI) => {
  try {
    const response = await api.put(`/admin/products/${id}`, productData);
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update product');
  }
});

export const deleteProduct = createAsyncThunk('admin/deleteProduct', async (id, thunkAPI) => {
  try {
    await api.delete(`/admin/products/${id}`);
    return id;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete product');
  }
});

// Invoices
export const fetchInvoices = createAsyncThunk('admin/fetchInvoices', async (filters, thunkAPI) => {
  try {
    const response = await api.get('/admin/invoices', { params: filters });
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch invoices');
  }
});

export const addInvoice = createAsyncThunk('admin/addInvoice', async (invoiceData, thunkAPI) => {
  try {
    const response = await api.post('/admin/invoices', invoiceData);
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to add invoice');
  }
});

export const deleteInvoice = createAsyncThunk('admin/deleteInvoice', async (id, thunkAPI) => {
  try {
    await api.delete(`/admin/invoices/${id}`);
    return id;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete invoice');
  }
});

export const updateInvoice = createAsyncThunk('admin/updateInvoice', async ({ id, invoiceData }, thunkAPI) => {
  try {
    const response = await api.put(`/admin/invoices/${id}`, invoiceData);
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update invoice');
  }
});

// Payments
export const fetchPayments = createAsyncThunk('admin/fetchPayments', async (_, thunkAPI) => {
  try {
    const response = await api.get('/admin/payments');
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch payments');
  }
});

export const addPayment = createAsyncThunk('admin/addPayment', async (paymentData, thunkAPI) => {
  try {
    const response = await api.post('/admin/payments', paymentData);
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to add payment');
  }
});

// Reports
export const fetchReports = createAsyncThunk('admin/fetchReports', async (_, thunkAPI) => {
  try {
    const response = await api.get('/admin/reports');
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch reports');
  }
});

const initialState = {
  clients: [],
  products: [],
  invoices: [],
  payments: [],
  reports: null,
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearAdminError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Clients
      .addCase(fetchClients.pending, (state) => { state.loading = true; })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.loading = false;
        state.clients = action.payload;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add Client
      .addCase(addClient.fulfilled, (state, action) => {
        state.clients.unshift(action.payload);
      })
      // Update Client
      .addCase(updateClient.fulfilled, (state, action) => {
        const index = state.clients.findIndex(c => c._id === action.payload._id);
        if (index !== -1) {
          state.clients[index] = action.payload;
        }
      })
      // Delete Client
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.clients = state.clients.filter(c => c._id !== action.payload);
      })

      // Fetch Products
      .addCase(fetchProducts.pending, (state) => { state.loading = true; })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add Product
      .addCase(addProduct.fulfilled, (state, action) => {
        state.products.unshift(action.payload);
      })
      // Update Product
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.products.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
      })
      // Delete Product
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.products = state.products.filter(p => p._id !== action.payload);
      })

      // Fetch Invoices
      .addCase(fetchInvoices.pending, (state) => { state.loading = true; })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.invoices = action.payload;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add Invoice
      .addCase(addInvoice.fulfilled, (state, action) => {
        state.invoices.unshift(action.payload);
      })
      // Delete Invoice
      .addCase(deleteInvoice.fulfilled, (state, action) => {
        state.invoices = state.invoices.filter(inv => inv._id !== action.payload);
      })
      // Update Invoice
      .addCase(updateInvoice.fulfilled, (state, action) => {
        const index = state.invoices.findIndex(inv => inv._id === action.payload._id);
        if (index !== -1) {
          state.invoices[index] = action.payload;
        }
      })

      // Fetch Payments
      .addCase(fetchPayments.pending, (state) => { state.loading = true; })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add Payment
      .addCase(addPayment.fulfilled, (state, action) => {
        state.payments.unshift(action.payload);
      })

      // Fetch Reports
      .addCase(fetchReports.pending, (state) => { state.loading = true; })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = action.payload;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearAdminError } = adminSlice.actions;
export default adminSlice.reducer;
