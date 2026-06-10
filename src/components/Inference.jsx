import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
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
      // Native fetch API cleanly handles multipart form streaming on Hugging Face proxies
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned an error status: ${response.status}`);
      }

      const rawData = await response.json();
      console.log("🔍 Direct API Response Payload:", rawData);

      // 1. Safely parse classification prediction verdict strings
      const decisionString = rawData.prediction || rawData.decision || 'spoof';
      const isGenuine = decisionString.toLowerCase() === 'genuine' || decisionString.toLowerCase() === 'bonafide';

      // 2. Read whole numeric percentages natively from confidence payload maps
      const bonafideRaw = rawData.confidence?.bonafide ?? (isGenuine ? 100 : 0);
      const spoofRaw = rawData.confidence?.spoof ?? (isGenuine ? 0 : 100);

      // 3. Bind validated properties directly to display mapping models
      const mappedResult = {
        filename: rawData.filename || selectedFile.name,
        prediction: isGenuine ? 'bonafide' : 'spoof',
        bonafideScore: Number(bonafideRaw).toFixed(2),
        spoofScore: Number(spoofRaw).toFixed(2)
      };

      setCurrentResult(mappedResult);

      // 4. Record entry to historical Firebase auditing metrics logs
      await addDoc(collection(db, "predictions_history"), {
        userId: user.uid,
        filename: mappedResult.filename,
        prediction: mappedResult.prediction,
        bonafideScore: parseFloat(mappedResult.bonafideScore),
        spoofScore: parseFloat(mappedResult.spoofScore),
        timestamp: new Date()
      });

    } catch (err) {
      console.error("Forensic execution fault:", err);
      setUiError(err.message || "Connection timeout to cloud ML workspace failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '65vh', width: '100%', overflow: 'hidden' }}>
      <style>{`
        .bg-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 70vw; height: 60vh; background: radial-gradient(ellipse at center, rgba(99, 102, 241, 0.1) 0%, rgba(15, 23, 42, 0) 60%); pointer-events: none; z-index: 0; }
        .upload-bar-container { background: rgba(30, 31, 32, 0.4); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 8px 32px rgba(0, 0, 0, 0.5); transition: all 0.3s ease; }
        .upload-bar-container:hover, .upload-bar-container:focus-within { background: rgba(40, 42, 47, 0.5); border: 1px solid rgba(255, 255, 255, 0.15); box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 0 25px rgba(99, 102, 241, 0.3); }
        .submit-btn { transition: all 0.2s ease; }
        .submit-btn:not(:disabled):hover { transform: scale(1.05); box-shadow: 0 0 15px rgba(99, 102, 241, 0.5); }
        @keyframes fade-up { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .results-card { animation: fade-up 0.4s ease-out forwards; }
      `}</style>

      <div className="bg-glow"></div>
      
      <div style={{ zIndex: 2, width: '100%', maxWidth: '52rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '350', color: '#e2e8f0', marginBottom: '2.5rem', textAlign: 'center', letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
          Static File Forensic Verification
        </h1>

        <form onSubmit={handleInferenceExecution} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="upload-bar-container" style={{ display: 'flex', alignItems: 'center', width: '100%', borderRadius: '9999px', padding: '1.5rem', position: 'relative' }}>
            <AudioLines size={30} style={{ color: selectedFile ? '#818cf8' : '#94a3b8', flexShrink: 0 }} />
            <label htmlFor="file-ingest" style={{ flex: 1, display: 'flex', alignItems: 'center', marginLeft: '1rem', cursor: 'pointer', height: '40px' }}>
              <span style={{ fontSize: '1.2rem', color: selectedFile ? '#f8fafc' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedFile ? selectedFile.name : "Select raw audio file (.wav, .flac, .mp3)"}
              </span>
              <input type="file" accept=".wav,.flac,.mp3" onChange={e => setSelectedFile(e.target.files[0])} style={{ display: 'none' }} id="file-ingest" />
            </label>

            <button type="submit" className="submit-btn" disabled={isProcessing || !selectedFile} style={{ width: '50px', height: '50px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', backgroundColor: selectedFile ? '#e2e8f0' : 'rgba(255,255,255,0.05)', color: selectedFile ? '#0f172a' : '#5f6368', marginLeft: '1rem', cursor: selectedFile && !isProcessing ? 'pointer' : 'not-allowed' }}>
              {isProcessing ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <ArrowUp size={20} strokeWidth={2.5} />}
            </button>
          </div>
          {uiError && <div style={{ marginTop: '1.5rem', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem 1.5rem', borderRadius: '9999px', fontSize: '0.875rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{uiError}</div>}
        </form>

        {currentResult && (
          <div className="results-card" style={{ marginTop: '3rem', width: '100%', background: 'rgba(30, 31, 32, 0.6)', backdropFilter: 'blur(16px)', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem' }}>
              {currentResult.prediction === 'bonafide' ? (
                <ShieldCheck size={48} style={{ color: '#22c55e' }} />
              ) : (
                <ShieldAlert size={48} style={{ color: '#ef4444' }} />
              )}
              <div>
                <div style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8' }}>Forensic Verdict</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: currentResult.prediction === 'bonafide' ? '#4ade80' : '#f87171' }}>
                  {currentResult.prediction === 'bonafide' ? "Human Signature Verified" : "Synthetic Spoof Footprint Flagged"}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#cbd5e1' }}>Bonafide Acoustic Match Integrity</span>
                  <span style={{ color: '#22c55e', fontWeight: '600' }}>{currentResult.bonafideScore}%</span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', backgroundColor: '#22c55e', width: `${currentResult.bonafideScore}%`, transition: 'width 0.3s ease' }}></div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#cbd5e1' }}>Neural Generation Footprint Vector</span>
                  <span style={{ color: '#ef4444', fontWeight: '600' }}>{currentResult.spoofScore}%</span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', backgroundColor: '#ef4444', width: `${currentResult.spoofScore}%`, transition: 'width 0.3s ease' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}