import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Shield } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Login submitted:', formData);
    setLoading(true);
    
    setTimeout(() => {
      try {
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        const email = formData.email.toLowerCase().trim();
        
        if (users[email] && formData.password === users[email].password) {
          localStorage.setItem('currentUser', email);
          localStorage.setItem('userData', JSON.stringify(users[email]));
          console.log('Login success, navigating...');
          navigate('/dashboard');
        } else {
          alert('Invalid credentials. Try demo@example.com / demo123');
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        alert('Error logging in');
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-center items-center mb-8">
          <Link to="/" className="flex items-center gap-3 cursor-pointer">
            <div className="h-10 w-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Disaster Management</h1>
              <p className="text-xs text-slate-500">National Authority</p>
            </div>
          </Link>
        </div>

        <Card className="max-w-md mx-auto border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Login to access your disaster management dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white py-6 text-lg rounded-md"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <div className="text-center">
                <span className="text-sm text-slate-600">Don't have an account? </span>
                <Link to="/register" className="text-sm font-semibold text-red-600">
                  Register Now
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
