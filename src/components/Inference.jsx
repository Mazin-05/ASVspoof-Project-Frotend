import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Loader2, ShieldCheck, ShieldAlert, AudioLines, ArrowUp, ChevronDown, Cpu } from 'lucide-react';

// Define endpoints mapping configuration model matrix
const MODEL_REGISTRY = {
  asv2021: {
    name: "ASVspoof 2021 (Baseline)",
    url: "https://mozmo-asvspoof-api.hf.space/predict",
    description: "Transformer-Driven Deepfake Voice Analyzer"
  },
  asv5: {
    name: "ASVspoof v5 (New Weights)",
    url: "https://mozmo-asvspoof-api.hf.space/predict_2025", // Just replace this string when ready!
    description: "Enhanced Neural Footprint Discrimination Engine"
  }
};

export default function Inference({ user }) {
  const [selectedModel, setSelectedModel] = useState('asv2021');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [uiError, setUiError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const activeModelConfig = MODEL_REGISTRY[selectedModel];

  const handleInferenceExecution = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsProcessing(true);
    setUiError('');
    setCurrentResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // Directs payload dynamically to the currently selected model weight URL
      const response = await fetch(activeModelConfig.url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned an error status: ${response.status}`);
      }

      const rawData = await response.json();
      console.log(`🔍 ${activeModelConfig.name} API Payload:`, rawData);

      const decisionString = rawData.prediction || rawData.decision || 'spoof';
      const isGenuine = decisionString.toLowerCase() === 'genuine' || decisionString.toLowerCase() === 'bonafide';

      const bonafideRaw = rawData.confidence?.bonafide ?? (isGenuine ? 100 : 0);
      const spoofRaw = rawData.confidence?.spoof ?? (isGenuine ? 0 : 100);

      const mappedResult = {
        filename: rawData.filename || selectedFile.name,
        prediction: isGenuine ? 'bonafide' : 'spoof',
        bonafideScore: Number(bonafideRaw).toFixed(2),
        spoofScore: Number(spoofRaw).toFixed(2)
      };

      setCurrentResult(mappedResult);

      // Record telemetry entry with model metadata attached to auditing collections
      await addDoc(collection(db, "predictions_history"), {
        userId: user.uid,
        modelKey: selectedModel,
        modelName: activeModelConfig.name,
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
        
        .model-selector-pill { background: rgba(30, 31, 32, 0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 9999px; padding: 0.5rem 1.25rem; display: flex; align-items: center; gap: 0.5rem; color: #e2e8f0; cursor: pointer; transition: all 0.2s; user-select: none; font-size: 0.9rem; }
        .model-selector-pill:hover { background: rgba(40, 42, 47, 0.8); border-color: rgba(99, 102, 241, 0.4); }
        
        .model-dropdown-menu { position: absolute; top: 110%; left: 50%; transform: translateX(-50%); background: #1e1f20; border: 1px solid #444746; border-radius: 12px; width: 280px; padding: 0.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.5); z-index: 50; display: flex; flex-direction: column; gap: 0.25rem; }
        .model-dropdown-item { padding: 0.75rem 1rem; border-radius: 8px; cursor: pointer; transition: background 0.2s; display: flex; flex-direction: column; text-align: left; background: transparent; border: none; }
        .model-dropdown-item:hover { background: rgba(255,255,255,0.05); }
        .model-dropdown-item.active { background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.2); }

        @keyframes fade-up { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .results-card { animation: fade-up 0.4s ease-out forwards; }
      `}</style>

      <div className="bg-glow"></div>
      
      <div style={{ zIndex: 2, width: '100%', maxWidth: '52rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* Model Dropdown Selection System */}
        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
          <button className="model-selector-pill" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
            <Cpu size={16} style={{ color: '#818cf8' }} />
            <span style={{ fontWeight: '500' }}>{activeModelConfig.name}</span>
            <ChevronDown size={14} style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#94a3b8' }} />
          </button>

          {isDropdownOpen && (
            <div className="model-dropdown-menu">
              {Object.entries(MODEL_REGISTRY).map(([key, config]) => (
                <button
                  key={key}
                  className={`model-dropdown-item ${selectedModel === key ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedModel(key);
                    setIsDropdownOpen(false);
                    setCurrentResult(null); // Clear previous visual matrix state to avoid mismatched contexts
                  }}
                >
                  <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#f8fafc' }}>{config.name}</span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>{config.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <h1 style={{ fontSize: '2.5rem', fontWeight: '350', color: '#e2e8f0', marginBottom: '2.5rem', textAlign: 'center', letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
          Static File Forensic Verification
        </h1>

        <form onSubmit={handleInferenceExecution} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="upload-bar-container" style={{ display: 'flex', alignItems: 'center', width: '100%', borderRadius: '9999px', padding: '1.5rem', position: 'relative' }}>
            <AudioLines size={30} style={{ color: selectedFile ? '#818cf8' : '#94a3b8', flexShrink: 0 }} />
            <label htmlFor="file-ingest" style={{ flex: 1, display: 'flex', alignItems: 'center', marginLeft: '1rem', cursor: 'pointer', height: '40px' }}>
              <span style={{ fontSize: '1.2rem', color: selectedFile ? '#f8fafc' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedFile ? selectedFile.name : `Select raw audio file for verification pass`}
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
                <div style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8' }}>Forensic Verdict ({activeModelConfig.name})</div>
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