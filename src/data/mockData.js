export const INCIDENT_TYPES = {
  FLOOD: { id: 'flood', translationKey: 'incidentTypes.flood', icon: 'Droplets', color: 'bg-blue-500' },
  FIRE: { id: 'fire', translationKey: 'incidentTypes.fire', icon: 'Flame', color: 'bg-orange-500' },
  MEDICAL: { id: 'medical', translationKey: 'incidentTypes.medical', icon: 'HeartPulse', color: 'bg-red-600' },
  SUPPLY: { id: 'supply', translationKey: 'incidentTypes.supply', icon: 'Package', color: 'bg-yellow-500' },
  INFRASTRUCTURE: { id: 'infrastructure', translationKey: 'incidentTypes.infrastructure', icon: 'TriangleAlert', color: 'bg-slate-600' },
};

export const SEVERITY_LEVELS = {
  CRITICAL: { id: 'critical', label: 'Critical', color: 'text-critical', bg: 'bg-red-100 border-red-200' },
  HIGH: { id: 'high', label: 'High', color: 'text-orange-600', bg: 'bg-orange-100 border-orange-200' },
  MEDIUM: { id: 'medium', label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100 border-yellow-200' },
  LOW: { id: 'low', label: 'Low', color: 'text-green-600', bg: 'bg-green-100 border-green-200' },
};

export const STATUSES = {
  REPORTED: { id: 'reported', label: 'Reported', color: 'bg-red-100 text-red-700' },
  IN_PROGRESS: { id: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  RESOLVED: { id: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-700' },
};

// Initial simulated incidents
export const INITIAL_INCIDENTS = [
  {
    id: 'inc-001',
    type: 'FIRE',
    severity: 'CRITICAL',
    status: 'IN_PROGRESS',
    lat: 28.6139,
    lng: 77.2090, // New Delhi example
    locationName: 'Connaught Place, Block B',
    description: 'Structure fire reported in commercial building. Smoke visible.',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    reporterId: 'civ-01',
    verified: true,
    votes: 12,
  },
  {
    id: 'inc-002',
    type: 'FLOOD',
    severity: 'HIGH',
    status: 'REPORTED',
    lat: 28.6219,
    lng: 77.2190,
    locationName: 'Barakhamba Road',
    description: 'Heavy water logging blocking ambulance access.',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    reporterId: 'civ-02',
    verified: false,
    votes: 5,
  },
  {
    id: 'inc-003',
    type: 'MEDICAL',
    severity: 'CRITICAL',
    status: 'REPORTED',
    lat: 28.6100,
    lng: 77.2300,
    locationName: 'India Gate Circle',
    description: 'Multi-vehicle collision. Multiple injuries reported.',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
    reporterId: 'civ-03',
    verified: true,
    votes: 8,
  }
];

export const INITIAL_RESOURCES = [
  { id: 'res-001', type: 'Water', quantity: 500, unit: 'Liters', lat: 28.6129, lng: 77.2293, status: 'AVAILABLE' },
  { id: 'res-002', type: 'Medical Kits', quantity: 50, unit: 'Kits', lat: 28.6149, lng: 77.2000, status: 'LIMITED' },
  { id: 'res-003', type: 'Food', quantity: 200, unit: 'Packets', lat: 28.6200, lng: 77.2100, status: 'AVAILABLE' },
];

export const INITIAL_VOLUNTEERS = [
  { id: 'vol-001', name: 'Team Alpha', status: 'DEPLOYED', lat: 28.6130, lng: 77.2080, currentTaskId: 'inc-001' },
  { id: 'vol-002', name: 'Team Beta', status: 'AVAILABLE', lat: 28.6180, lng: 77.2150, currentTaskId: null },
];
