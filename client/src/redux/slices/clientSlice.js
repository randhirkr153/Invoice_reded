import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async Thunks
export const fetchClientInvoices = createAsyncThunk('client/fetchClientInvoices', async (status, thunkAPI) => {
  try {
    const response = await api.get('/client/invoices', { params: { status } });
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch invoices');
  }
});

export const fetchClientPayments = createAsyncThunk('client/fetchClientPayments', async (_, thunkAPI) => {
  try {
    const response = await api.get('/client/payments');
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch payments');
  }
});

export const fetchClientDashboard = createAsyncThunk('client/fetchClientDashboard', async (_, thunkAPI) => {
  try {
    const response = await api.get('/client/dashboard');
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard metrics');
  }
});

export const payClientInvoice = createAsyncThunk('client/payClientInvoice', async (paymentPayload, thunkAPI) => {
  try {
    const response = await api.post('/client/pay', paymentPayload);
    return response.data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Mock payment failed to process');
  }
});

const initialState = {
  invoices: [],
  payments: [],
  dashboard: null,
  loading: false,
  error: null,
};

const clientSlice = createSlice({
  name: 'client',
  initialState,
  reducers: {
    clearClientError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Invoices
      .addCase(fetchClientInvoices.pending, (state) => { state.loading = true; })
      .addCase(fetchClientInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.invoices = action.payload;
      })
      .addCase(fetchClientInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Payments
      .addCase(fetchClientPayments.pending, (state) => { state.loading = true; })
      .addCase(fetchClientPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload;
      })
      .addCase(fetchClientPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Dashboard
      .addCase(fetchClientDashboard.pending, (state) => { state.loading = true; })
      .addCase(fetchClientDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboard = action.payload;
      })
      .addCase(fetchClientDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Pay Invoice
      .addCase(payClientInvoice.pending, (state) => { state.loading = true; })
      .addCase(payClientInvoice.fulfilled, (state, action) => {
        state.loading = false;
        // Update local invoice item status to paid
        const index = state.invoices.findIndex(inv => inv._id === action.payload.invoice._id);
        if (index !== -1) {
          state.invoices[index] = action.payload.invoice;
        }
      })
      .addCase(payClientInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearClientError } = clientSlice.actions;
export default clientSlice.reducer;
