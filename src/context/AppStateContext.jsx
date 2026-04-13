import React, { createContext, useContext, useState, useEffect } from 'react';

const AppStateContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const AppProvider = ({ children }) => {
  const [incidents, setIncidents] = useState([]);
  const [resources, setResources] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [currentUser, setCurrentUser] = useState(null);
  const userRole = currentUser?.role || 'GUEST';

  const fetchData = async () => {
    try {
      const [incidentsRes, resourcesRes, volunteersRes] = await Promise.all([
        fetch(`${API_URL}/incidents`),
        fetch(`${API_URL}/resources`),
        fetch(`${API_URL}/volunteers`)
      ]);
      
      const incidentsData = await incidentsRes.json();
      const resourcesData = await resourcesRes.json();
      const volunteersData = await volunteersRes.json();
      
      setIncidents(incidentsData);
      setResources(resourcesData);
      setVolunteers(volunteersData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const login = (role, userData) => {
    setCurrentUser({ role, ...userData });
  };

  const logout = () => {
    setCurrentUser(null);
  }; 

  const addIncident = async (incident) => {
    try {
      const response = await fetch(`${API_URL}/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...incident,
          reporterPhone: currentUser?.phone
        })
      });
      
      const newIncident = await response.json();
      setIncidents(prev => [newIncident, ...prev]);
      return newIncident;
    } catch (err) {
      console.error('Error creating incident:', err);
      const fallbackIncident = {
        ...incident,
        id: `inc-${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: 'REPORTED',
        verified: false,
        votes: 0,
      };
      setIncidents(prev => [fallbackIncident, ...prev]);
      return fallbackIncident;
    }
  };

  const updateIncidentStatus = async (id, status) => {
    try {
      await fetch(`${API_URL}/incidents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, verified: true })
      });
    } catch (err) {
      console.error('Error updating incident:', err);
    }
    
    setIncidents(prev => prev.map(inc => 
      inc.id === id ? { ...inc, status } : inc
    ));
  };

  const deleteIncident = (id) => {
    setIncidents(prev => prev.filter(inc => inc.id !== id));
  };

  const verifyIncident = (id) => {
    setIncidents(prev => prev.map(inc => 
      inc.id === id ? { ...inc, verified: true } : inc
    ));
  };

  const stats = {
    active: incidents.filter(i => i.status !== 'RESOLVED').length,
    critical: incidents.filter(i => i.severity === 'CRITICAL' && i.status !== 'RESOLVED').length,
    resolved: incidents.filter(i => i.status === 'RESOLVED').length,
    resourcesAvailable: resources.filter(r => r.status === 'AVAILABLE').length,
  };

  const value = {
    incidents,
    resources,
    volunteers,
    userRole,
    loading,

    addIncident,
    updateIncidentStatus,
    deleteIncident,
    verifyIncident,
    stats,
    currentUser,
    login,
    logout,
    refreshData: fetchData,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
};