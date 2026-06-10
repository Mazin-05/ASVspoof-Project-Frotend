import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Loader2, ShieldCheck, ShieldAlert, UploadCloud, AudioLines } from 'lucide-react';

export default function FileUploadInference({ user }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
    setResult(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an audio file first.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('https://mozmo-asvspoof-api.hf.space/predict', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned error status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);

      // Save history log metrics into Firebase Firestore
      await addDoc(collection(db, 'predictions_history'), {
        userId: user.uid,
        filename: file.name,
        prediction: data.decision.toLowerCase() === 'genuine' ? 'bonafide' : 'spoof',
        bonafideScore: data.metrics?.genuine_probability ? round(data.metrics.genuine_probability * 100, 2) : 0,
        spoofScore: data.metrics?.spoof_probability ? round(data.metrics.spoof_probability * 100, 2) : 0,
        timestamp: new Date()
      });

    } catch (err) {
      setError(err.message || 'An error occurred while uploading and analyzing the file.');
    } finally {
      setLoading(false);
    }
  };

  const round = (num, decimalPlaces) => {
    return Number(Math.round(num + 'e' + decimalPlaces) + 'e-' + decimalPlaces);
  };

  return (
    <div style={{ width: '100%', maxWidth: '36rem', margin: '0 auto', padding: '2rem' }}>
      <h2 style={{ fontSize: '1.75rem', color: '#e2e8f0', marginBottom: '1.5rem', fontWeight: '350' }}>
        Static File Analysis
      </h2>
      
      <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ border: '2px dashed rgba(255,255,255,0.15)', borderRadius: '1rem', padding: '3rem', textAlign: 'center', backgroundColor: 'rgba(30,31,32,0.2)', cursor: 'pointer', position: 'relative' }}>
          <input 
            type="file" 
            accept=".wav,.flac" 
            onChange={handleFileChange} 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
          />
          <UploadCloud size={48} style={{ color: '#4f46e5', marginBottom: '1rem' }} />
          <p style={{ color: '#cbd5e1', fontSize: '1rem' }}>
            {file ? file.name : "Drag & drop or click to select a file"}
          </p>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: '0.5rem' }}>
            Supports high-fidelity 16kHz .wav or .flac structures
          </span>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ width: '100%', padding: '0.875rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#4f46e5', color: '#fff', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          {loading ? (
            <>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Processing Deep Learning Layers...
            </>
          ) : (
            <>
              <AudioLines size={18} /> Execute Forensic Diagnostics
            </>
          )}
        </button>
      </form>

      {error && (
        <div style={{ marginTop: '1.5rem', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontSize: '0.875rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '2rem', background: 'rgba(30,31,32,0.6)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            {result.decision.toLowerCase() === 'genuine' ? (
              <ShieldCheck size={36} style={{ color: '#22c55e' }} />
            ) : (
              <ShieldAlert size={36} style={{ color: '#ef4444' }} />
            )}
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: '600', color: result.decision.toLowerCase() === 'genuine' ? '#4ade80' : '#f87171' }}>
                {result.decision.toLowerCase() === 'genuine' ? "Verified Genuine Human Speech" : "Synthetic Spoof Payload Flagged"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}