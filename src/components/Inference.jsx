import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import axios from 'axios';
import { Loader2, ShieldCheck, ShieldAlert, AudioLines, ArrowUp } from 'lucide-react';

const API_URL = "https://mozmo-asvspoof-api.hf.space/predict";

export default function Inference({ user }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [uiError, setUiError] = useState('');

  const handleInferenceExecution = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsProcessing(true);
    setUiError('');
    setCurrentResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post(API_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const inferenceData = response.data;
      setCurrentResult(inferenceData);

      await addDoc(collection(db, "predictions_history"), {
        userId: user.uid,
        filename: inferenceData.filename,
        prediction: inferenceData.prediction,
        bonafideScore: inferenceData.confidence.bonafide,
        spoofScore: inferenceData.confidence.spoof,
        timestamp: new Date()
      });

    } catch (err) {
      setUiError(err.response?.data?.detail || "Connection timeout to cloud ML workspace failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '75vh', width: '100%', overflow: 'hidden' }}>
      
      {/* Dynamic CSS for Floating Background & Glossy Bar */}
      <style>{`
        .bg-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 70vw;
          height: 60vh;
          background: radial-gradient(ellipse at center, rgba(99, 102, 241, 0.12) 0%, rgba(15, 23, 42, 0) 60%);
          pointer-events: none;
          z-index: 0;
        }

        /* Slowly floats the entire wave container around the center */
        @keyframes float-around {
          0% { transform: translate(-50%, -50%) translate(0px, 0px); }
          33% { transform: translate(-50%, -50%) translate(35px, -20px); }
          66% { transform: translate(-50%, -50%) translate(-25px, 15px); }
          100% { transform: translate(-50%, -50%) translate(0px, 0px); }
        }

        .moving-wave-container {
          position: absolute;
          top: 50%;
          left: 50%;
          display: flex;
          gap: 6px;
          align-items: center;
          justify-content: center;
          animation: float-around 14s ease-in-out infinite;
          z-index: 0;
          pointer-events: none;
        }

        /* Makes the small bars pulse height and glow intensity */
        @keyframes wave-pulse-glow {
          0%, 100% { height: 8px; filter: drop-shadow(0 0 2px rgba(99,102,241,0.3)); opacity: 0.3; background: #6366f1; }
          50% { height: 35px; filter: drop-shadow(0 0 15px rgba(165,180,252,0.9)); opacity: 0.9; background: #a5b4fc; }
        }

        .small-glow-bar {
          width: 6px;
          border-radius: 9999px;
          animation: wave-pulse-glow 1.5s infinite ease-in-out alternate;
        }

        /* Glossy / Glassmorphism effect for the input bar */
        .upload-bar-container {
          background: rgba(30, 31, 32, 0.4);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 8px 32px rgba(0, 0, 0, 0.5);
          transition: all 0.3s ease;
        }
        .upload-bar-container:hover, .upload-bar-container:focus-within {
          background: rgba(40, 42, 47, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 0 25px rgba(99, 102, 241, 0.3);
        }

        .submit-btn {
          transition: all 0.2s ease;
        }
        .submit-btn:not(:disabled):hover {
          transform: scale(1.05);
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.6);
        }

        @keyframes fade-up {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .results-card {
          animation: fade-up 0.5s ease-out forwards;
        }
      `}</style>

      {/* Ambient Glow */}
      <div className="bg-glow"></div>
      
      {/* Moving Small Glow Wave */}
      {/* <div className="moving-wave-container">
        {[0.1, 0.5, 0.2, 0.8, 0.3, 0.9, 0.4, 0.7].map((delay, i) => (
          <div key={i} className="small-glow-bar" style={{ animationDelay: `${delay}s` }}></div>
        ))}
      </div> */}

      {/* Main Foreground Content */}
      <div style={{ zIndex: 2, width: '110%', maxWidth: '52rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        <h1 style={{ fontSize: '2.5rem', fontWeight: '350', color: '#e2e8f0', marginBottom: '2.5rem', textAlign: 'center', letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
          Welcome, {user?.displayName || ''}! Let's make it safe to trust voices again.
          <span style={{ display: 'block', fontSize: '1.125rem', color: '#94a3b8', marginTop: '0.75rem', fontWeight: '400' }}>
            {/* Ready to verify? Upload an audio matrix below. */}
          </span>
        </h1>

        <form onSubmit={handleInferenceExecution} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          {/* Glossy Upload Bar */}
          <div className="upload-bar-container" style={{ display: 'flex', alignItems: 'center', width: '100%', borderRadius: '9999px', padding: '1.5rem 1.5rem 1.5rem 1.5rem', position: 'relative' }}>
            
            <AudioLines size={30} style={{ color: selectedFile ? '#818cf8' : '#94a3b8', flexShrink: 0 }} />
            
            <label htmlFor="file-ingest" style={{ flex: 1, display: 'flex', alignItems: 'center', marginLeft: '1rem', cursor: 'pointer', height: '40px' }}>
              <span style={{ fontSize: '1.5rem', color: selectedFile ? '#f8fafc' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedFile ? selectedFile.name : "Select raw audio file (.wav, .flac, .mp3)"}
              </span>
              <input type="file" accept=".wav,.flac,.mp3,.m4a" onChange={e => setSelectedFile(e.target.files[0])} style={{ display: 'none' }} id="file-ingest" />
            </label>

            {/* Upload Button */}
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isProcessing || !selectedFile} 
              style={{ 
                width: '50px', height: '50px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: selectedFile && !isProcessing ? 'pointer' : 'not-allowed',
                backgroundColor: selectedFile ? '#e2e8f0' : 'rgba(255,255,255,0.05)',
                color: selectedFile ? '#0f172a' : '#5f6368',
                marginLeft: '1rem'
              }}
            >
              {isProcessing ? (
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <ArrowUp size={20} strokeWidth={2.5} />
              )}
            </button>
          </div>
          
          {uiError && <div style={{ marginTop: '1.5rem', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem 1.5rem', borderRadius: '9999px', fontSize: '0.875rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{uiError}</div>}
        </form>

        {/* Results Matrix */}
        {currentResult && (
          <div className="results-card" style={{ marginTop: '3rem', width: '100%', background: 'rgba(30, 31, 32, 0.6)', backdropFilter: 'blur(16px)', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem' }}>
              {currentResult.prediction === 'bonafide' ? (
                <ShieldCheck size={48} style={{ color: '#22c55e', filter: 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.3))' }} />
              ) : (
                <ShieldAlert size={48} style={{ color: '#ef4444', filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.3))' }} />
              )}
              <div>
                <div style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.05em', color: '#94a3b8' }}>Forensic Verdict</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: currentResult.prediction === 'bonafide' ? '#4ade80' : '#f87171' }}>
                  {currentResult.prediction === 'bonafide' ? "Human Signature Verified" : "Synthetic Spoof Flagged"}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#cbd5e1' }}>Bonafide Acoustic Match</span>
                  <span style={{ fontWeight: '600', color: '#22c55e' }}>{currentResult.confidence.bonafide}%</span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', backgroundColor: '#22c55e', width: `${currentResult.confidence.bonafide}%`, transition: 'width 1s ease-out' }}></div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#cbd5e1' }}>Neural Generation Footprint</span>
                  <span style={{ fontWeight: '600', color: '#ef4444' }}>{currentResult.confidence.spoof}%</span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', backgroundColor: '#ef4444', width: `${currentResult.confidence.spoof}%`, transition: 'width 1s ease-out' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}