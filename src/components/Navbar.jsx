import React from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { AudioLines, LogOut, LayoutDashboard, History } from 'lucide-react';

export default function Navbar({ user, currentView, setCurrentView }) {
  return (
    <nav style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #334155', padding: '1rem 2rem', display: 'flex', justifyContent: 'between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ color: '#6366f1' }}><AudioLines size={28} /></div>
          <span style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.025em' }}>Audio Forensics Workspace</span>
        </div>
        
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => setCurrentView('dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.375rem', backgroundColor: currentView === 'dashboard' ? '#334155' : 'transparent', color: currentView === 'dashboard' ? '#ffffff' : '#94a3b8', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            <LayoutDashboard size={16} /> Dashboard
          </button>
          <button 
            onClick={() => setCurrentView('history')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.375rem', backgroundColor: currentView === 'history' ? '#334155' : 'transparent', color: currentView === 'history' ? '#ffffff' : '#94a3b8', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            <History size={16} /> Audit Logs
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginLeft: 'auto' }}>
        <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Operator: <strong style={{ color: '#cbd5e1' }}>{user.email}</strong></span>
        <button onClick={() => signOut(auth)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.375rem', backgroundColor: '#334155', color: '#f1f5f9', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </nav>
  );
}