import React from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { AudioLines, LogOut, LayoutDashboard, Radio, History } from 'lucide-react';

export default function Navbar({ user, currentView, setCurrentView }) {
  const linkStyle = (targetView) => ({
    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontSize: '0.875rem',
    backgroundColor: currentView === targetView ? '#334155' : 'transparent',
    color: currentView === targetView ? '#ffffff' : '#94a3b8'
  });

  return (
    <nav style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #334155', padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ color: '#6366f1' }}><AudioLines size={28} /></div>
        <span style={{ fontSize: '1.25rem', fontWeight: '700' }}>Audio Forensics</span>
      </div>
      
      <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '2rem' }}>
        <button onClick={() => setCurrentView('dashboard')} style={linkStyle('dashboard')}>
          <LayoutDashboard size={16} /> File Upload
        </button>
        <button onClick={() => setCurrentView('realtime')} style={linkStyle('realtime')}>
          <Radio size={16} /> Live Stream
        </button>
        <button onClick={() => setCurrentView('history')} style={linkStyle('history')}>
          <History size={16} /> Audit Logs
        </button>
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