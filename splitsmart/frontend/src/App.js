import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GroupDetail from './pages/GroupDetail';
import CreateGroup from './pages/CreateGroup';
import AddExpense from './pages/AddExpense';
import './App.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/"         element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/groups/new" element={<PrivateRoute><CreateGroup /></PrivateRoute>} />
            <Route path="/groups/:id" element={<PrivateRoute><GroupDetail /></PrivateRoute>} />
            <Route path="/groups/:id/add-expense" element={<PrivateRoute><AddExpense /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
