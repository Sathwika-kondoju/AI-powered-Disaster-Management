// Mock data for disaster management system

export const mockDisasterAlerts = [
  {
    id: '1',
    type: 'flood',
    severity: 'high',
    location: 'Mumbai, Maharashtra',
    probability: 78,
    status: 'active',
    message: 'Heavy rainfall expected. Flood risk high in low-lying areas.',
    timestamp: new Date().toISOString(),
    lastUpdate: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: '2',
    type: 'cyclone',
    severity: 'medium',
    location: 'Chennai, Tamil Nadu',
    probability: 45,
    status: 'monitoring',
    message: 'Cyclonic circulation detected in Bay of Bengal.',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    lastUpdate: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: '3',
    type: 'earthquake',
    severity: 'low',
    location: 'Delhi, Delhi',
    probability: 12,
    status: 'all_clear',
    message: 'Seismic activity within normal range.',
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    lastUpdate: new Date(Date.now() - 900000).toISOString()
  },
  {
    id: '4',
    type: 'flood',
    severity: 'medium',
    location: 'Bangalore, Karnataka',
    probability: 35,
    status: 'monitoring',
    message: 'Moderate rainfall predicted. Low-lying areas may experience waterlogging.',
    timestamp: new Date(Date.now() - 5400000).toISOString(),
    lastUpdate: new Date(Date.now() - 2700000).toISOString()
  },
  {
    id: '5',
    type: 'flood',
    severity: 'high',
    location: 'Hyderabad, Telangana',
    probability: 85,
    status: 'active',
    message: 'Heavy rainfall currently happening. Flash flood risk in low-lying areas.',
    timestamp: new Date().toISOString(),
    lastUpdate: new Date().toISOString()
  },
  {
    id: '6',
    type: 'flood',
    severity: 'medium',
    location: 'Pune, Maharashtra',
    probability: 45,
    status: 'monitoring',
    message: 'Moderate to heavy rainfall expected. Stay alert.',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    lastUpdate: new Date(Date.now() - 900000).toISOString()
  },
  {
    id: '7',
    type: 'flood',
    severity: 'medium',
    location: 'Kolkata, West Bengal',
    probability: 40,
    status: 'monitoring',
    message: 'Monsoon activity increasing. Waterlogging possible.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    lastUpdate: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: '8',
    type: 'flood',
    severity: 'low',
    location: 'Ahmedabad, Gujarat',
    probability: 25,
    status: 'monitoring',
    message: 'Light to moderate rainfall expected.',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    lastUpdate: new Date(Date.now() - 5400000).toISOString()
  },
  {
    id: '9',
    type: 'flood',
    severity: 'medium',
    location: 'Lucknow, Uttar Pradesh',
    probability: 50,
    status: 'monitoring',
    message: 'Heavy rainfall alert. Flood preparedness recommended.',
    timestamp: new Date(Date.now() - 2700000).toISOString(),
    lastUpdate: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: '10',
    type: 'flood',
    severity: 'medium',
    location: 'Kochi, Kerala',
    probability: 55,
    status: 'monitoring',
    message: 'Monsoon surge active. Coastal flooding possible.',
    timestamp: new Date(Date.now() - 4500000).toISOString(),
    lastUpdate: new Date(Date.now() - 2700000).toISOString()
  }
];

export const mockWeatherData = {
  temperature: 28,
  humidity: 75,
  windSpeed: 15,
  precipitation: 65,
  condition: 'Rainy',
  forecast: [
    { day: 'Today', temp: 28, condition: 'Rainy', risk: 'high' },
    { day: 'Tomorrow', temp: 26, condition: 'Cloudy', risk: 'medium' },
    { day: 'Day 3', temp: 30, condition: 'Sunny', risk: 'low' },
    { day: 'Day 4', temp: 29, condition: 'Partly Cloudy', risk: 'low' },
    { day: 'Day 5', temp: 27, condition: 'Rainy', risk: 'medium' }
  ]
};

export const mockNotifications = [
  {
    id: '1',
    type: 'alert',
    message: 'Flood Alert: Stay away from waterlogged areas',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    read: false
  },
  {
    id: '2',
    type: 'update',
    message: 'Weather Update: Heavy rainfall continues',
    timestamp: new Date(Date.now() - 5400000).toISOString(),
    read: false
  },
  {
    id: '3',
    type: 'info',
    message: 'Emergency contact numbers updated',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    read: true
  }
];

export const disasterDosAndDonts = {
  flood: {
    dos: [
      'Move to higher ground immediately',
      'Keep emergency supplies ready',
      'Stay informed through official channels',
      'Follow evacuation orders promptly',
      'Turn off electricity and gas if safe to do so'
    ],
    donts: [
      "Don't walk through moving water",
      "Don't drive through flooded areas",
      "Don't touch electrical equipment if wet",
      "Don't return home until authorities say it's safe",
      "Don't drink floodwater"
    ]
  },
  cyclone: {
    dos: [
      'Stay indoors and away from windows',
      'Listen to weather updates regularly',
      'Secure loose objects outside',
      'Stock up on food, water, and medicines',
      'Keep emergency kit ready'
    ],
    donts: [
      "Don't go outside during the cyclone",
      "Don't use candles during power outage",
      "Don't spread rumors",
      "Don't venture out immediately after the cyclone passes",
      "Don't touch fallen power lines"
    ]
  },
  earthquake: {
    dos: [
      'Drop, Cover, and Hold On during shaking',
      'Stay away from windows and heavy furniture',
      'Move to open ground if outside',
      'Check for injuries after the quake',
      'Be prepared for aftershocks'
    ],
    donts: [
      "Don't use elevators",
      "Don't rush to exits during shaking",
      "Don't stand near buildings if outside",
      "Don't light matches if you smell gas",
      "Don't spread unverified information"
    ]
  }
};


export const mockEmergencyContacts = [
  { name: 'NDRF Helpline', number: '011-24363260' },
  { name: 'State Control Room', number: '1070' },
  { name: 'Police Emergency', number: '100' },
  { name: 'Ambulance', number: '102' },
  { name: 'Fire Brigade', number: '101' }
];

export const mockUserData = {
  name: 'Rajesh Kumar',
  email: 'rajesh.kumar@example.com',
  phone: '+91 9876543210',
  location: {
    city: 'Mumbai',
    state: 'Maharashtra',
    latitude: 19.0760,
    longitude: 72.8777
  },
  alertPreferences: {
    sms: true,
    email: true,
    push: true
  },
  registeredAt: new Date('2024-01-15').toISOString()
};
