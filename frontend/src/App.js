import React, { useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';

function App() {
  // Initialize demo account on first load
  useEffect(() => {
    const initializeDemoAccount = () => {
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      
      // Create demo account if not exists
      if (!users['demo@example.com']) {
        users['demo@example.com'] = {
          name: 'Demo User',
          email: 'demo@example.com',
          phone: '+91 9876543210',
          password: 'demo123',
          location: {
            city: 'Hyderabad',
            state: 'Telangana',
            latitude: '17.3850',
            longitude: '78.4867'
          },
          alertPreferences: {
            sms: true,
            email: true,
            push: true
          },
          registeredAt: new Date().toISOString()
        };
        localStorage.setItem('users', JSON.stringify(users));
        console.log('Demo account created: demo@example.com / demo123');
      }
    };
    
    initializeDemoAccount();
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;
