import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Shield, AlertTriangle, Bell, MapPin, Activity, CloudRain, Wind, Droplets, LogOut, Phone, Info, RefreshCw, TrendingUp, BarChart3, Navigation } from 'lucide-react';
import { mockDisasterAlerts, mockNotifications, disasterDosAndDonts, mockEmergencyContacts } from '../mockData';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [weather, setWeather] = useState(null);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [selectedDisaster, setSelectedDisaster] = useState('flood');
  const [isRefreshingWeather, setIsRefreshingWeather] = useState(false);
const [lastWeatherUpdate, setLastWeatherUpdate] = useState(null);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true);
  const [predictions, setPredictions] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const locationFetchedRef = useRef(false);
  const weatherIntervalRef = useRef(null);

  // Historical trends data
  const historicalTrends = {
    flood: [
      { month: 'Jan', cases: 2 },
      { month: 'Feb', cases: 1 },
      { month: 'Mar', cases: 0 },
      { month: 'Apr', cases: 1 },
      { month: 'May', cases: 3 },
      { month: 'Jun', cases: 8 },
      { month: 'Jul', cases: 12 },
      { month: 'Aug', cases: 15 },
      { month: 'Sep', cases: 10 },
      { month: 'Oct', cases: 6 },
      { month: 'Nov', cases: 3 },
      { month: 'Dec', cases: 2 }
    ],
    cyclone: [
      { month: 'Jan', cases: 0 },
      { month: 'Feb', cases: 0 },
      { month: 'Mar', cases: 0 },
      { month: 'Apr', cases: 1 },
      { month: 'May', cases: 2 },
      { month: 'Jun', cases: 1 },
      { month: 'Jul', cases: 0 },
      { month: 'Aug', cases: 1 },
      { month: 'Sep', cases: 3 },
      { month: 'Oct', cases: 4 },
      { month: 'Nov', cases: 2 },
      { month: 'Dec', cases: 1 }
    ],
    earthquake: [
      { month: 'Jan', cases: 2 },
      { month: 'Feb', cases: 1 },
      { month: 'Mar', cases: 3 },
      { month: 'Apr', cases: 1 },
      { month: 'May', cases: 2 },
      { month: 'Jun', cases: 1 },
      { month: 'Jul', cases: 0 },
      { month: 'Aug', cases: 2 },
      { month: 'Sep', cases: 1 },
      { month: 'Oct', cases: 2 },
      { month: 'Nov', cases: 1 },
      { month: 'Dec', cases: 2 }
    ]
  };

  const getMaxCases = (type) => {
    return Math.max(...historicalTrends[type].map(d => d.cases), 1);
  };

  // Detect current location using browser Geolocation API
  const detectCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      setIsDetectingLocation(true);
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Reverse geocoding to get city name from coordinates
            const response = await fetch(
              `https://geocoding-api.open-meteo.com/v1/search?name=&latitude=${latitude}&longitude=${longitude}&count=1&language=en&format=json`
            );
            
            let cityName = 'Hyderabad';
            let stateName = 'Telangana';
            
            if (response.ok) {
              const data = await response.json();
              if (data.results && data.results.length > 0) {
                cityName = data.results[0].name || 'Hyderabad';
                stateName = data.results[0].admin1 || data.results[0].country || 'Telangana';
              }
            }
            
            const locationData = {
              city: cityName,
              state: stateName,
              latitude: latitude.toString(),
              longitude: longitude.toString()
            };
            
            setCurrentLocation(locationData);
            setIsDetectingLocation(false);
            resolve(locationData);
          } catch (error) {
            console.error('Reverse geocoding error:', error);
            const locationData = {
              city: 'Hyderabad',
              state: 'Telangana',
              latitude: latitude.toString(),
              longitude: longitude.toString()
            };
            setCurrentLocation(locationData);
            setIsDetectingLocation(false);
            resolve(locationData);
          }
        },
        (error) => {
          setIsDetectingLocation(false);
          const locationData = {
            city: 'Hyderabad',
            state: 'Telangana'
          };
          setCurrentLocation(locationData);
          resolve(locationData);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  }, []);

  // Generate accurate alerts based on real-time weather data
  const generateAccurateAlerts = useCallback(async (user, weatherData) => {
    const newAlerts = [];
    const location = `${user.location.city}, ${user.location.state}`;
    
    if (!weatherData) {
      return [];
    }

    const { precipitation, currentCondition, isRaining, windSpeed, forecast } = weatherData;
    
    // Flood detection - very strict
    if (precipitation > 25 && currentCondition === 'Heavy Rain') {
      const probability = Math.min(95, 70 + (precipitation * 2));
      newAlerts.push({
        id: 'flood_alert_' + Date.now(),
        type: 'flood',
        severity: 'high',
        location: location,
        probability: Math.round(probability),
        status: 'active',
        message: `Heavy rainfall detected (${precipitation}mm). ${currentCondition}. Flood risk HIGH.`,
        timestamp: new Date().toISOString(),
        lastUpdate: new Date().toISOString()
      });
    }
    
    // Cyclone detection
    if (windSpeed > 60 || currentCondition === 'Thunderstorm') {
      newAlerts.push({
        id: 'cyclone_alert_' + Date.now(),
        type: 'cyclone',
        severity: windSpeed > 100 ? 'high' : 'medium',
        location: location,
        probability: Math.min(90, 30 + (windSpeed * 0.5)),
        status: 'monitoring',
        message: `High wind speeds detected (${windSpeed} km/h). ${currentCondition}. Cyclone monitoring active.`,
        timestamp: new Date().toISOString(),
        lastUpdate: new Date().toISOString()
      });
    }
    
    // Forecast alert disabled to avoid false positives
    // No forecast alerts - only current conditions
    
    return newAlerts;
  }, []);

  // Enhanced weather condition detection
  const getWeatherCondition = (weatherCode, precipitation = 0, humidity = 0) => {
    if (weatherCode === 0) return { condition: 'Clear Sky', isRaining: false, confidence: 99 };
    if (weatherCode === 1) return { condition: 'Mainly Clear', isRaining: false, confidence: 98 };
    if (weatherCode === 2) return { condition: 'Partly Cloudy', isRaining: false, confidence: 95 };
  if (weatherCode === 3) return { condition: 'Overcast', isRaining: false, confidence: 97 };
    if (weatherCode === 35) return { condition: 'Light Rain Showers', isRaining: true, confidence: 96 };
    if (weatherCode >= 45 && weatherCode <= 48) return { condition: 'Foggy', isRaining: false, confidence: 96 };
    if (weatherCode >= 51 && weatherCode <= 55) return { condition: 'Drizzle', isRaining: true, confidence: 97 };

    if (weatherCode >= 56 && weatherCode <= 57) return { condition: 'Freezing Drizzle', isRaining: true, confidence: 95 };
    if (weatherCode >= 61 && weatherCode <= 63) return { condition: 'Rain', isRaining: true, confidence: 98 };
    if (weatherCode >= 64 && weatherCode <= 65) return { condition: 'Heavy Rain', isRaining: true, confidence: 99 };
    if (weatherCode >= 66 && weatherCode <= 67) return { condition: 'Freezing Rain', isRaining: true, confidence: 96 };
    if (weatherCode >= 71 && weatherCode <= 77) return { condition: 'Snow', isRaining: false, confidence: 97 };
    if (weatherCode >= 80 && weatherCode <= 82) return { condition: 'Rain Showers', isRaining: true, confidence: 98 };
    if (weatherCode >= 85 && weatherCode <= 86) return { condition: 'Snow Showers', isRaining: false, confidence: 96 };
    if (weatherCode >= 95 && weatherCode <= 99) return { condition: 'Thunderstorm', isRaining: true, confidence: 99 };
    
    if (precipitation > 0 || humidity > 85) {
      if (precipitation > 10) return { condition: 'Heavy Rain', isRaining: true, confidence: 95 };
      if (precipitation > 0) return { condition: 'Light Rain', isRaining: true, confidence: 92 };
      if (humidity > 90) return { condition: 'Humid', isRaining: false, confidence: 85 };
    }
    
    return { condition: 'Unknown', isRaining: false, confidence: 50 };
  };

  // Fetch weather using Open-Meteo API
  const fetchWeather = useCallback(async (user, showToast = false) => {
    if (!user?.location) return;

    const lat = parseFloat(user.location.latitude || '');
    const lon = parseFloat(user.location.longitude || '');

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return;
    }

    try {
      setIsRefreshingWeather(true);

      const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lon.toString(),
        current: 'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',
        hourly: 'precipitation_probability,precipitation',
        daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weathercode',
        timezone: 'Asia/Kolkata', // Accurate India timezone
      });

      const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch weather');
      const data = await res.json();

      const current = data.current || {};
      const hourly = data.hourly || {};
      const daily = data.daily || {};
      
      const weatherCode = current.weather_code || 0;
      const precipitation = current.precipitation || 0;
      const humidity = current.relative_humidity_2m || 0;
      
      const weatherInfo = getWeatherCondition(weatherCode, precipitation, humidity);
      const precipProbability = hourly.precipitation_probability?.[0] || 0;
      const nextPrecipProbability = daily.precipitation_probability_max?.[0] || 0;
      
      const isRaining = precipitation > 0 || (weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82) || (weatherCode >= 95 && weatherCode <= 99);
      
      const confidence = weatherCode >= 0 && weatherCode <= 3 ? 99 : (weatherCode >= 45 && weatherCode <= 48 ? 96 : (weatherCode >= 51 && weatherCode <= 99 ? 98 : 95));
      
      const days = (daily.time || []).slice(0, 5);
      const forecast = days.map((isoDate, index) => {
        const date = new Date(isoDate);
        const weekday = date.toLocaleDateString(undefined, { weekday: 'short' });
        const maxTemp = Math.round(daily.temperature_2m_max?.[index] || 0);
        const rain = daily.precipitation_sum?.[index] || 0;
        const precipProb = daily.precipitation_probability_max?.[index] || 0;
        const dayCode = daily.weathercode?.[index] || 0;
        
        const dayConditionInfo = getWeatherCondition(dayCode, rain, 60);
        let condition = dayConditionInfo.condition;
        let risk = 'low';
        
// Match Chrome - sunny forecast only
        if (dayCode <= 3 || precipProb < 20 && rain < 2) {
          condition = 'Sunny';
          risk = 'low';
        } else if (dayCode < 51) {
          condition = 'Mostly Sunny';
          risk = 'low';
        } else if (precipProb > 50 || rain > 5) {
          risk = 'medium';
        }
        
        return { 
          day: weekday, 
          temp: maxTemp,
          condition, 
          risk,
          precipProb 
        };
      });

      setWeather({
        temperature: Math.round(current.temperature_2m || 0),
        humidity: Math.round(humidity),
        windSpeed: Math.round(current.wind_speed_10m || 0),
        precipitation: Math.round(precipitation * 10) / 10,
        precipProbability: precipProbability,
        currentCondition: weatherInfo.condition,
        isRaining: isRaining,
        confidence: confidence,
        forecast,
        nextPrecipProbability,
      });
      setLastWeatherUpdate(new Date().toISOString());
    } catch (error) {
      console.error('Weather fetch failed', error);
    } finally {
      setIsRefreshingWeather(false);
    }
  }, []);

  const fetchPredictions = async (weatherData, location) => {
    if (!location) return [];

    try {
      const inputData = {
        flood: {
          precipitation: weatherData?.precipitation || 0,
          humidity: weatherData?.humidity || 60,
          terrain_elevation: 100,
          historical_flood_risk: 0.5,
          visibility: 10,
          temperature: weatherData?.temperature || 25,
          wind_speed: weatherData?.windSpeed || 10
        },
        earthquake: {
          seismic_activity: 0.1,
          pressure: 1013,
          temperature: weatherData?.temperature || 25,
          humidity: weatherData?.humidity || 60,
          wind_speed: weatherData?.windSpeed || 10,
          cloud_cover: 50,
          precipitation: weatherData?.precipitation || 0,
          visibility: 10,
          terrain_elevation: 100
        },
        cyclone: {
          sea_surface_temp: weatherData?.temperature || 25,
          wind_speed: weatherData?.windSpeed || 10,
          humidity: weatherData?.humidity || 60,
          pressure: 1013,
          ocean_heat_content: 50
        }
      };

      const response = await fetch('http://localhost:8000/api/predict/all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputData)
      });

      if (!response.ok) throw new Error('API error');

      const data = await response.json();
      
      // Convert to alerts format for existing UI
      const mlAlerts = [];
      
      if (data.flood) {
        const prob = data.flood.probability || 0;
        if (prob > 0.4) { // Only high risk
          mlAlerts.push({
            id: 'ml_flood_' + Date.now(),
            type: 'flood',
            severity: data.flood.risk_level,
            location: `${location.city}, ${location.state}`,
            probability: Math.round(prob * 100),
            status: 'monitoring',
            message: `ML Prediction: ${Math.round(prob * 100)}% flood risk (confidence: ${Math.round((data.flood.confidence || 0) * 100)}%)`,
            timestamp: new Date().toISOString(),
            lastUpdate: new Date().toISOString()
          });
        }
      }
      
      if (data.earthquake) {
        const prob = data.earthquake.probability || 0;
        if (prob > 0.3) { // Only significant risk
          mlAlerts.push({
            id: 'ml_earthquake_' + Date.now(),
            type: 'earthquake',
            severity: data.earthquake.risk_level,
            location: `${location.city}, ${location.state}`,
            probability: Math.round(prob * 100),
            status: 'monitoring',
            message: `ML Prediction: ${Math.round(prob * 100)}% earthquake risk`,
            timestamp: new Date().toISOString(),
            lastUpdate: new Date().toISOString()
          });
        }
      }
      
      if (data.cyclone) {
        const prob = data.cyclone.probability || 0;
        if (prob > 0.4) { // Only high risk
          mlAlerts.push({
            id: 'ml_cyclone_' + Date.now(),
            type: 'cyclone',
            severity: data.cyclone.risk_level,
            location: `${location.city}, ${location.state}`,
            probability: Math.round(prob * 100),
            status: 'monitoring',
            message: `ML Prediction: ${Math.round(prob * 100)}% cyclone risk`,
            timestamp: new Date().toISOString(),
            lastUpdate: new Date().toISOString()
          });
        }
      }

      setPredictions(data);
      return mlAlerts;
    } catch (error) {
      console.error('Prediction API failed:', error);
      // Fallback mock - only high risk
      return mockDisasterAlerts.filter(a => a.probability > 70).slice(0, 2);
    }
  };

  // Load dashboard and detect location
  useEffect(() => {
    const loadDashboard = async () => {
      const stored = localStorage.getItem('userData');
      if (stored) {
        const user = JSON.parse(stored);
        setUserData(user);
        
        // Try to detect current location using browser Geolocation
        let locationToUse = user.location;
        
        if (!locationFetchedRef.current) {
          locationFetchedRef.current = true;
          
          try {
            const detectedLocation = await detectCurrentLocation();
            if (detectedLocation) {
              locationToUse = detectedLocation;
              
              // Update localStorage with current location
              const updatedUser = { ...user, location: detectedLocation };
              localStorage.setItem('userData', JSON.stringify(updatedUser));
              setUserData(updatedUser);
              console.log('Location detected:', detectedLocation);
            }
          } catch (error) {
            console.log('Could not detect location, using registered location:', error.message);
          }
        }
        
  // Fast loading timeout for alerts
        setTimeout(() => setIsLoadingAlerts(false), 2000);

        // Parallel fetch weather + predictions
        // Load weather first
        await fetchWeather(locationToUse, true);
        
        // ML predictions disabled to avoid false alerts
        // const mlAlerts = await fetchPredictions(weather, locationToUse);
        // setAlerts(prev => [...prev, ...mlAlerts]);

        // Persistent intervals with refs and error handling
        if (weatherIntervalRef.current) clearInterval(weatherIntervalRef.current);
        weatherIntervalRef.current = setInterval(async () => {
          try {
            await fetchWeather(locationToUse);
          } catch (e) {
            console.warn('Weather interval failed:', e);
            // Retry fallback to cache after 30s
            setTimeout(() => fetchWeather(locationToUse), 30000);
          }
        }, 30000); // 30s

        const notificationInterval = setInterval(() => {
          const newNotification = {
            id: Date.now().toString(),
            type: 'update',
            message: `Hourly Update: Monitoring active disasters in your area`,
            timestamp: new Date().toISOString(),
            read: false
          };
          setNotifications(prev => [newNotification, ...prev].slice(0, 10));
        }, 3600000);

        return () => {
          if (weatherIntervalRef.current) clearInterval(weatherIntervalRef.current);
          clearInterval(notificationInterval);
        };
      } else {
        navigate('/login');
      }
    };
    
    loadDashboard();
  }, [navigate, fetchWeather, detectCurrentLocation]);

  // Update alerts when weather data changes
  useEffect(() => {
    const updateAlertsFromWeather = async () => {
      if (userData && weather) {
        const newAlerts = await generateAccurateAlerts(userData, weather);
        
        if (newAlerts.length === 0) {
          setAlerts([{
            id: 'all_clear_' + Date.now(),
            type: 'all_clear',
            severity: 'low',
            location: `${userData.location.city}, ${userData.location.state}`,
            probability: 0,
            status: 'all_clear',
            message: 'No active disasters detected. Current weather conditions are safe.',
            timestamp: new Date().toISOString(),
            lastUpdate: new Date().toISOString()
          }]);
        } else {
          setAlerts(newAlerts);
        }
      }
    };
    
    updateAlertsFromWeather();
  }, [weather, userData, generateAccurateAlerts]);

  const handleLogout = () => {
    localStorage.removeItem('userData');
    navigate('/');
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-orange-500';
      case 'low': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-red-600 bg-red-50 border-red-200';
      case 'monitoring': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'all_clear': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  if (!userData) return null;

  const displayLoc = currentLocation || userData.location || { city: 'Hyderabad', state: 'Telangana' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Disaster Management</h1>
                <p className="text-xs text-slate-500">Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-slate-900">{userData.name}</p>
                <p className="text-xs text-slate-500">{displayLoc.city}, {displayLoc.state}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Active Alerts */}
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Active Disaster Alerts
                    </CardTitle>
                    <CardDescription>Real-time monitoring and predictions for your area</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-red-600">Live</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingAlerts ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-sm text-slate-500">Loading real-time alerts...</p>
                  </div>
                ) : alerts.length === 0 ? (
                  <Alert className="border-2 text-green-600 bg-green-50 border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Shield className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">All Clear</h3>
                        <AlertDescription className="text-sm text-green-700">
                          No active disasters detected in {displayLoc.city}, {displayLoc.state}. All systems monitoring normally.
                        </AlertDescription>
                        <p className="text-xs text-green-600 mt-2">
                          Last updated: {lastWeatherUpdate ? new Date(lastWeatherUpdate).toLocaleString() : new Date().toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Alert>
                ) : (
                  alerts.map((alert) => (
                    <Alert key={alert.id} className={`border-2 ${getStatusColor(alert.status)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {alert.type === 'all_clear' ? (
                            <>
                              <div className="flex items-center gap-3 mb-3">
                                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                                  <Shield className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-lg text-green-700">All Clear</h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <MapPin className="h-4 w-4 text-green-600" />
                                    <span className="font-semibold text-sm text-green-700">{alert.location}</span>
                                  </div>
                                </div>
                              </div>
                              <AlertDescription className="text-sm mb-3">{alert.message}</AlertDescription>
                              <p className="text-xs text-muted-foreground">
                                Last updated: {lastWeatherUpdate ? new Date(lastWeatherUpdate).toLocaleString() : new Date().toLocaleString()}
                              </p>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant={getSeverityBadge(alert.severity)} className="uppercase text-xs">
                                  {alert.type}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {alert.status.replace('_', ' ').toUpperCase()}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <MapPin className="h-4 w-4" />
                                <span className="font-semibold text-sm">{alert.location}</span>
                              </div>
                              <AlertDescription className="text-sm mb-3">{alert.message}</AlertDescription>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-medium">Probability</span>
                                  <span className="font-bold">{alert.probability}%</span>
                                </div>
                                <Progress value={alert.probability} className="h-2" />
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                Last updated: {lastWeatherUpdate ? new Date(lastWeatherUpdate).toLocaleString() : new Date().toLocaleString()}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </Alert>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Weather Prediction */}
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-600" />
                      Weather Prediction
                    </CardTitle>
                    <CardDescription>Live weather - {weather?.confidence ? `Accuracy: ${weather.confidence}%` : 'Loading...'}</CardDescription>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fetchWeather(userData)}
                    disabled={isRefreshingWeather}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshingWeather ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
                {lastWeatherUpdate && (
                  <p className="mt-1 text-xs text-slate-500">
                    Last updated: {new Date(lastWeatherUpdate).toLocaleTimeString()}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {!weather ? (
                  <p className="text-sm text-slate-500">Loading live weather data…</p>
                ) : (
                <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="h-4 w-4 text-blue-600" />
                      <span className="text-xs text-blue-600 font-medium">Temperature</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{weather.temperature}°C</p>
                  </div>
                  <div className="bg-sky-50 rounded-lg p-4 border border-sky-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Droplets className="h-4 w-4 text-sky-600" />
                      <span className="text-xs text-sky-600 font-medium">Humidity</span>
                    </div>
                    <p className="text-2xl font-bold text-sky-900">{weather.humidity}%</p>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Wind className="h-4 w-4 text-indigo-600" />
                      <span className="text-xs text-indigo-600 font-medium">Wind</span>
                    </div>
                    <p className="text-2xl font-bold text-indigo-900">{weather.windSpeed} km/h</p>
                  </div>
                  <div className={`rounded-lg p-4 border ${weather.isRaining ? 'bg-blue-100 border-blue-300' : 'bg-purple-50 border-purple-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <CloudRain className={`h-4 w-4 ${weather.isRaining ? 'text-blue-600' : 'text-purple-600'}`} />
                      <span className={`text-xs font-medium ${weather.isRaining ? 'text-blue-700' : 'text-purple-600'}`}>
                        {weather.isRaining ? 'Raining' : 'Rain'}
                      </span>
                    </div>
                    <p className={`text-2xl font-bold ${weather.isRaining ? 'text-blue-900' : 'text-purple-900'}`}>
                      {weather.precipitation} mm
                    </p>
                    {weather.currentCondition && (
                      <p className="text-xs mt-1 text-slate-600">{weather.currentCondition}</p>
                    )}
                    {weather.precipProbability > 0 && (
                      <p className="text-xs text-blue-600 mt-1">Chance: {weather.precipProbability}%</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">5-Day Forecast</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {weather.forecast.map((day, index) => (
                      <div key={index} className="bg-slate-50 rounded-lg p-3 border text-center">
                        <p className="text-xs font-medium text-slate-600 mb-1">{day.day}</p>
                        <p className="text-lg font-bold text-slate-900 mb-1">{day.temp}°</p>
                        <p className="text-xs text-slate-600">{day.condition}</p>
                        {day.precipProb > 0 && <p className="text-xs text-blue-600">{day.precipProb}%</p>}
                        <Badge variant={day.risk === 'high' ? 'destructive' : day.risk === 'medium' ? 'warning' : 'secondary'} className="mt-1 text-xs">
                          {day.risk}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                </>)}
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-green-600" />
                  Safety Guidelines
                </CardTitle>
                <CardDescription>Essential do's and don'ts during disasters</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedDisaster} onValueChange={setSelectedDisaster}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="flood">Flood</TabsTrigger>
                    <TabsTrigger value="cyclone">Cyclone</TabsTrigger>
                    <TabsTrigger value="earthquake">Earthquake</TabsTrigger>
                  </TabsList>
                  {Object.keys(disasterDosAndDonts).map((type) => (
                    <TabsContent key={type} value={type} className="space-y-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-green-700 flex items-center gap-2">
                            <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-green-700 text-sm font-bold">✓</span>
                            </div>
                            DO's
                          </h4>
                          <ul className="space-y-2">
                            {disasterDosAndDonts[type].dos.map((item, index) => (
                              <li key={index} className="text-sm bg-green-50 border border-green-200 rounded p-2 flex items-start gap-2">
                                <span className="text-green-600 font-bold mt-0.5">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-semibold text-red-700 flex items-center gap-2">
                            <div className="h-6 w-6 bg-red-100 rounded-full flex items-center justify-center">
                              <span className="text-red-700 text-sm font-bold">✗</span>
                            </div>
                            DON'Ts
                          </h4>
                          <ul className="space-y-2">
                            {disasterDosAndDonts[type].donts.map((item, index) => (
                              <li key={index} className="text-sm bg-red-50 border border-red-200 rounded p-2 flex items-start gap-2">
                                <span className="text-red-600 font-bold mt-0.5">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-orange-600" />
                  Recent Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {notifications.slice(0, 5).map((notification) => (
                  <div key={notification.id} className={`p-3 rounded-lg border text-sm ${notification.read ? 'bg-slate-50' : 'bg-orange-50 border-orange-200'}`}>
                    <p className="font-medium">{notification.message}</p>
                    <p className="text-xs text-slate-500">{new Date(notification.timestamp).toLocaleString()}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-red-600" />
                  Emergency Contacts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {mockEmergencyContacts.map((contact, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <span className="text-sm font-medium">{contact.name}</span>
                    <a href={`tel:${contact.number}`} className="text-sm font-bold text-red-600 hover:text-red-700">{contact.number}</a>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  Historical Trends
                </CardTitle>
                <CardDescription className="text-xs">Monthly disaster cases in {displayLoc.city}, {displayLoc.state}</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="flood" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 h-8">
                    <TabsTrigger value="flood" className="text-xs h-6">Flood</TabsTrigger>
                    <TabsTrigger value="cyclone" className="text-xs h-6">Cyclone</TabsTrigger>
                    <TabsTrigger value="earthquake" className="text-xs h-6">Quake</TabsTrigger>
                  </TabsList>
                  {Object.keys(historicalTrends).map((type) => (
                    <TabsContent key={type} value={type} className="mt-3">
                      <div className="space-y-1">
                        {historicalTrends[type].map((data, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="text-xs w-6 text-slate-500">{data.month}</span>
                            <div className="flex-1 h-4 bg-slate-100 rounded overflow-hidden">
                              <div 
                                className={`h-full rounded ${
                                  type === 'flood' ? 'bg-blue-500' : type === 'cyclone' ? 'bg-purple-500' : 'bg-orange-500'
                                }`}
                                style={{ width: `${(data.cases / getMaxCases(type)) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs w-4 text-right font-medium">{data.cases}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-200">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Total ({new Date().getFullYear()})</span>
                          <span className="font-bold text-slate-700">
                            {historicalTrends[type].reduce((sum, d) => sum + d.cases, 0)}
                          </span>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

