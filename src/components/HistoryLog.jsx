import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { History, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function HistoryLog({ user }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const historyRef = collection(db, "predictions_history");
    const q = query(
      historyRef, 
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(records);
      setLoading(false);
    }, (err) => {
      console.error("Firestore loading blocked. Ensure index generation completed.", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Calculate statistics for the Pie Chart
  const bonafideCount = history.filter(item => item.prediction === 'bonafide').length;
  const spoofCount = history.filter(item => item.prediction !== 'bonafide').length;
  
  const chartData = [
    { name: 'Human Verified (Bonafide)', value: bonafideCount, color: '#22c55e' }, // Green
    { name: 'Synthetic Spoof Flagged', value: spoofCount, color: '#ef4444' }      // Red
  ];

  // Custom tooltip for dark mode
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: '#1e293b', padding: '1rem', border: '1px solid #334155', borderRadius: '0.5rem', color: '#f8fafc' }}>
          <p style={{ margin: 0, fontWeight: 600 }}>{payload[0].name}</p>
          <p style={{ margin: 0, color: payload[0].payload.color }}>
            Total Scans: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '70rem', margin: '0 auto' }}>
      
      {/* Top Section: Graphical Summary */}
      <div style={{ backgroundColor: '#1e293b', padding: '2rem', borderRadius: '1rem', border: '1px solid #334155' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PieChartIcon size={20} style={{ color: '#818cf8' }} /> Telemetry Overview
        </h3>
        
        {loading ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem 0' }}>Analyzing datasets...</div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem 0' }}>Insufficient data for graphical plotting.</div>
        ) : (
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#cbd5e1' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Bottom Section: Detailed Table */}
      <div style={{ backgroundColor: '#1e293b', padding: '2rem', borderRadius: '1rem', border: '1px solid #334155' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={20} style={{ color: '#818cf8' }} /> Audit Trail Log History
        </h3>
        
        {loading ? (
           <div style={{ textAlign: 'center', color: '#64748b', padding: '4rem 0', fontSize: '0.875rem' }}>Loading telemetry...</div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '4rem 0', fontSize: '0.875rem' }}>No telemetry logging stored.</div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '0.5rem', border: '1px solid #334155' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem', backgroundColor: '#0f172a' }}>
              <thead>
                <tr style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #334155' }}>
                  <th style={{ padding: '1rem', fontWeight: '600', color: '#cbd5e1' }}>File Name</th>
                  <th style={{ padding: '1rem', fontWeight: '600', color: '#cbd5e1' }}>Date & Time</th>
                  <th style={{ padding: '1rem', fontWeight: '600', color: '#cbd5e1' }}>Bonafide Match</th>
                  <th style={{ padding: '1rem', fontWeight: '600', color: '#cbd5e1' }}>Spoof Signature</th>
                  <th style={{ padding: '1rem', fontWeight: '600', color: '#cbd5e1', textAlign: 'center' }}>Final Verdict</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, index) => (
                  <tr 
                    key={item.id} 
                    style={{ 
                      borderBottom: index === history.length - 1 ? 'none' : '1px solid #1e293b',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <td style={{ padding: '1rem', color: '#e2e8f0', fontWeight: '500', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.filename}
                    </td>
                    <td style={{ padding: '1rem', color: '#94a3b8' }}>
                      {item.timestamp?.toDate().toLocaleString() || "Just now"}
                    </td>
                    <td style={{ padding: '1rem', color: '#22c55e', fontWeight: '600' }}>
                      {item.bonafideScore}%
                    </td>
                    <td style={{ padding: '1rem', color: '#ef4444', fontWeight: '600' }}>
                      {item.spoofScore}%
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{ 
                        display: 'inline-block', 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '9999px', 
                        fontSize: '0.75rem', 
                        fontWeight: '700', 
                        letterSpacing: '0.025em',
                        textTransform: 'uppercase', 
                        backgroundColor: item.prediction === 'bonafide' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
                        color: item.prediction === 'bonafide' ? '#4ade80' : '#f87171',
                        border: item.prediction === 'bonafide' ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
                      }}>
                        {item.prediction}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}