import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { AlertTriangle, Cloud, Activity, Shield, Bell, MapPin, Users, BarChart3 } from 'lucide-react';

const LandingPage = () => {
  const handleDashboard = () => {
    console.log('Dashboard button clicked');
  };

  const features = [
    {
      icon: AlertTriangle,
      title: 'Real-time Alerts',
      description: 'Get instant notifications about potential disasters in your area'
    },
    {
      icon: Cloud,
      title: 'Weather Prediction',
      description: 'AI-powered weather forecasting with disaster probability analysis'
    },
    {
      icon: Activity,
      title: 'Multi-Hazard Monitoring',
      description: 'Track floods, cyclones, earthquakes, and other natural disasters'
    },
    {
      icon: MapPin,
      title: 'Location-Based',
      description: 'Auto-detect your location for personalized disaster alerts'
    },
    {
      icon: Bell,
      title: 'Hourly Updates',
      description: 'Receive status updates every hour during active disasters'
    },
    {
      icon: Shield,
      title: 'Safety Guidelines',
      description: 'Access do\'s and don\'ts for each type of disaster'
    },
    {
      icon: Users,
      title: 'Community Reports',
      description: 'Share and receive real-time disaster reports from your community'
    },
    {
      icon: BarChart3,
      title: 'Historical Data',
      description: 'View past disaster patterns and trends in your region'
    }
  ];

  const disasterTypes = [
    { name: 'Floods', color: 'from-blue-500 to-blue-600' },
    { name: 'Cyclones', color: 'from-purple-500 to-purple-600' },
    { name: 'Earthquakes', color: 'from-orange-500 to-orange-600' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Disaster Management</h1>
              <p className="text-xs text-slate-500">National Authority</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link 
              to="/login"
              className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              Login
            </Link>
            <Link 
              to="/register"
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-md hover:from-red-600 hover:to-orange-600 transition-colors"
            >
              Register Now
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-4 py-2 mb-6">
            <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-red-700">Live Monitoring Active</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Stay Prepared,
            <br />
            <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Stay Safe
            </span>
          </h2>
          <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed">
            Advanced AI-powered disaster prediction and real-time alerts system.
            Monitor floods, cyclones, and earthquakes with accurate probability analysis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-6 text-lg bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-md hover:from-red-600 hover:to-orange-600 transition-colors inline-block text-center"
            >
              Get Started Free
            </Link>
            <button
              onClick={handleDashboard}
              className="px-8 py-6 text-lg border-2 border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              View Live Dashboard
            </button>
          </div>
        </div>

        {/* Disaster Types */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
          {disasterTypes.map((disaster, index) => (
            <Card key={index} className="border-2 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className={`h-12 w-12 bg-gradient-to-br ${disaster.color} rounded-lg mb-4 flex items-center justify-center`}>
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{disaster.name}</h3>
                <p className="text-slate-600">Real-time monitoring and prediction</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Comprehensive Protection</h3>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Advanced features to keep you and your community safe from natural disasters
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border hover:shadow-md transition-all duration-300">
                  <CardHeader>
                    <div className="h-12 w-12 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg flex items-center justify-center mb-3">
                      <Icon className="h-6 w-6 text-red-600" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription className="text-sm">{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl p-8 md:p-12 text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">24/7</div>
              <div className="text-red-50">Live Monitoring</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">95%</div>
              <div className="text-red-50">Prediction Accuracy</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">1 min</div>
              <div className="text-red-50">Alert Response Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-900 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Stay Protected?
          </h3>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            Join thousands of users who trust our platform for disaster preparedness
          </p>
          <Link
            to="/register"
            className="px-8 py-6 text-lg bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-md hover:from-red-600 hover:to-orange-600 transition-colors inline-block"
          >
            Register Now - It is Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-white font-semibold">Disaster Management</span>
            </div>
            <div className="text-slate-400 text-sm">
              2025 National Disaster Management Authority. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
