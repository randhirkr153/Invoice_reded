import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: JSON.parse(localStorage.getItem('client_user')) || null,
  token: localStorage.getItem('client_token') || null,
  isAuthenticated: !!localStorage.getItem('client_token'),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true;
      state.error = null;
    },
    loginSuccess(state, action) {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.accessToken;
      localStorage.setItem('client_user', JSON.stringify(action.payload.user));
      localStorage.setItem('client_token', action.payload.accessToken);
    },
    loginFail(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    logoutAction(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('client_user');
      localStorage.removeItem('client_token');
    },
    setToken(state, action) {
      state.token = action.payload;
      localStorage.setItem('client_token', action.payload);
    },
    updateUserProfile(state, action) {
      state.user = action.payload;
      localStorage.setItem('client_user', JSON.stringify(action.payload));
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFail,
  logoutAction,
  setToken,
  updateUserProfile,
} = authSlice.actions;

export default authSlice.reducer;
