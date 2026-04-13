import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Shield, MapPin, Loader2, CheckCircle2 } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    city: '',
    state: '',
    latitude: '',
    longitude: ''
  });

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      const params = new URLSearchParams({
        format: 'jsonv2',
        lat: latitude,
        lon: longitude,
        zoom: '10',
        email: 'support@example.com',
      });

      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
        headers: { 'Accept-Language': 'en' },
      });

      if (!response.ok) throw new Error('Reverse geocoding failed');

      const data = await response.json();
      const address = data.address || {};

      return {
        city: address.city || address.town || address.village || address.state_district || '',
        state: address.state || address.region || '',
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  };

  const detectLocation = () => {
    setLocationLoading(true);
    
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const preciseLocation = await reverseGeocode(latitude, longitude);

        const fallbackCities = [
          { lat: 19.0760, lon: 72.8777, city: 'Mumbai', state: 'Maharashtra' },
          { lat: 28.7041, lon: 77.1025, city: 'Delhi', state: 'Delhi' },
          { lat: 12.9716, lon: 77.5946, city: 'Bangalore', state: 'Karnataka' },
          { lat: 13.0827, lon: 80.2707, city: 'Chennai', state: 'Tamil Nadu' },
          { lat: 22.5726, lon: 88.3639, city: 'Kolkata', state: 'West Bengal' },
          { lat: 18.5204, lon: 73.8567, city: 'Pune', state: 'Maharashtra' },
          { lat: 17.3850, lon: 78.4867, city: 'Hyderabad', state: 'Telangana' },
          { lat: 23.0225, lon: 72.5714, city: 'Ahmedabad', state: 'Gujarat' },
        ];

        let fallbackLocation = fallbackCities[0];
        let minDistance = calculateDistance(latitude, longitude, fallbackCities[0].lat, fallbackCities[0].lon);

        for (let i = 1; i < fallbackCities.length; i++) {
          const distance = calculateDistance(latitude, longitude, fallbackCities[i].lat, fallbackCities[i].lon);
          if (distance < minDistance) {
            minDistance = distance;
            fallbackLocation = fallbackCities[i];
          }
        }

        const isUsingFallback = !preciseLocation?.city || preciseLocation.city === '';
        const resolvedCity = isUsingFallback ? fallbackLocation.city : preciseLocation.city;
        const resolvedState = isUsingFallback ? fallbackLocation.state : preciseLocation.state;

        setFormData(prev => ({
          ...prev,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
          city: resolvedCity,
          state: resolvedState
        }));
        
        setLocationDetected(true);
        setLocationLoading(false);
        
        alert(`Location detected: ${resolvedCity}, ${resolvedState}\nLat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}`);
      },
      (error) => {
        setLocationLoading(false);
        alert('Unable to detect location. Please enter manually.');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Register form submitted:', formData);
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters!');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      try {
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        const email = formData.email.toLowerCase();
        
        if (users[email]) {
          alert('Email already registered. Please login.');
          setLoading(false);
          return;
        }

        users[email] = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          location: {
            city: formData.city,
            state: formData.state,
            latitude: formData.latitude,
            longitude: formData.longitude
          },
          alertPreferences: {
            sms: true,
            email: true,
            push: true
          },
          registeredAt: new Date().toISOString()
        };

        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', email);
        localStorage.setItem('userData', JSON.stringify(users[email]));

        console.log('Registration success, navigating...');
        alert('Registration successful! Welcome ' + formData.name);
        navigate('/dashboard');
      } catch (error) {
        console.error('Registration error:', error);
        alert('Error registering. Please try again.');
      } finally {
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

        <Card className="max-w-2xl mx-auto border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>
              Register to receive disaster alerts and warnings for your area
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 9876543210"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirm Password</label>
                  <input
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Location Detection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border">
                  <MapPin className="h-5 w-5 text-slate-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {formData.city || formData.state ? `${formData.city}, ${formData.state}` : 'No location detected'}
                    </p>
                    {formData.latitude && formData.longitude && (
                      <p className="text-xs text-slate-500">
                        Lat: {formData.latitude}, Lon: {formData.longitude}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={locationLoading}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                  >
                    {locationLoading ? 'Detecting...' : locationDetected ? 'Detected' : 'Detect'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">City</label>
                  <input
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter city"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">State</label>
                  <input
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="Enter state"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Latitude</label>
                  <input
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    placeholder="Auto-detected"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Longitude</label>
                  <input
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    placeholder="Auto-detected"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white py-6 text-lg rounded-md"
                disabled={loading}
              >
                {loading ? 'Registering...' : 'Create Account'}
              </button>

              <div className="text-center">
                <span className="text-sm text-slate-600">Already have an account? </span>
                <Link to="/login" className="text-sm font-semibold text-red-600">
                  Login Now
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
