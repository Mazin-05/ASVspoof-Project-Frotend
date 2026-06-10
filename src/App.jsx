import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Auth from './components/Auth';
import Navbar from './components/Navbar';
import Inference from './components/Inference'; // This handles your static file uploads
import RealtimeInference from './components/RealtimeInference'; // We'll create this next
import HistoryLog from './components/HistoryLog';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'realtime' | 'history'

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setCurrentView('dashboard'); 
    });
    return () => unsubscribe();
  }, []);

  if (!user) {
    return <Auth />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc' }}>
      <Navbar user={user} currentView={currentView} setCurrentView={setCurrentView} />
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem' }}>
        {currentView === 'dashboard' && <Inference user={user} />}
        {currentView === 'realtime' && <RealtimeInference user={user} />}
        {currentView === 'history' && <HistoryLog user={user} />}
      </div>
    </div>
  );
}

// export default App;