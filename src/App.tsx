import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { Dashboard } from './components/Dashboard';
import { RMAList } from './components/RMAList';
import { RMADetails } from './components/RMADetails';
import { EditRMAForm } from './components/EditRMAForm';
import { NewRMAForm } from './components/NewRMAForm';
import { ManualsList } from './components/ManualsList';
import { Settings } from './components/Settings';
import { ForgotPassword } from './components/Auth/ForgotPassword';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/rmas" element={<RMAList />} />
        <Route path="/rmas/new" element={<NewRMAForm />} />
        <Route path="/rmas/:id" element={<RMADetails />} />
        <Route path="/rmas/:id/edit" element={<EditRMAForm />} />
        <Route path="/manuals" element={<ManualsList />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;