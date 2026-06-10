import React, { useState, useRef, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ShieldCheck, ShieldAlert, Mic, Square, Radio } from 'lucide-react';

export default function RealtimeInference({ user }) {
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [realtimeResult, setRealtimeResult] = useState(null);
  const [streamError, setStreamError] = useState('');

  const socketRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const processorRef = useRef(null);

  // Safely close any active streaming frames when leaving the page
  useEffect(() => {
    return () => stopRealtimeAnalysis();
  }, []);

  const startRealtimeAnalysis = async () => {
    setStreamError('');
    setRealtimeResult(null);

    try {
      // Establish secure WebSocket link pointing towards your ML host API
      socketRef.current = new WebSocket("wss://mozmo-asvspoof-api.hf.space/ws/analyze");
      
      socketRef.current.onmessage = (event) => {
        const rawData = JSON.parse(event.data);
        
        if (rawData.status === "streaming" || rawData.prediction) {
          // Parse the WebSocket payload to match the exact format used by the upload page
          const decisionString = rawData.prediction || 'spoof';
          const isGenuine = decisionString.toLowerCase() === 'genuine' || decisionString.toLowerCase() === 'bonafide';

          const mappedResult = {
            prediction: isGenuine ? 'bonafide' : 'spoof',
            bonafideScore: Number(rawData.confidence?.bonafide ?? (isGenuine ? 100 : 0)).toFixed(2),
            spoofScore: Number(rawData.confidence?.spoof ?? (isGenuine ? 0 : 100)).toFixed(2)
          };

          setRealtimeResult(mappedResult);
        } else if (rawData.status === "error") {
          setStreamError(rawData.message);
        }
      };

      socketRef.current.onerror = () => {
        setStreamError("Failed to maintain secure connection to streaming cluster.");
        stopRealtimeAnalysis();
      };

      // Request user permissions for the local microphone hardware
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, sampleRate: 16000 } });
      streamRef.current = stream;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const buffer = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          buffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        socketRef.current.send(buffer.buffer);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
      setIsLiveStreaming(true);

    } catch (err) {
      setStreamError(err.message || "Microphone initialization blocked.");
      stopRealtimeAnalysis();
    }
  };

  const stopRealtimeAnalysis = () => {
    setIsLiveStreaming(false);
    if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null; }
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (socketRef.current) {
      if (realtimeResult) {
        // Save the final streaming evaluation state safely to Firebase logs
        addDoc(collection(db, "predictions_history"), {
          userId: user.uid,
          filename: "Live Stream Auditing Session",
          prediction: realtimeResult.prediction,
          bonafideScore: parseFloat(realtimeResult.bonafideScore),
          spoofScore: parseFloat(realtimeResult.spoofScore),
          timestamp: new Date()
        }).catch(err => console.error("Firebase history log blocked:", err));
      }
      socketRef.current.close();
      socketRef.current = null;
    }
  };

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '65vh', width: '100%', overflow: 'hidden' }}>
      <style>{`
        .bg-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 70vw; height: 60vh; background: radial-gradient(ellipse at center, rgba(99, 102, 241, 0.1) 0%, rgba(15, 23, 42, 0) 60%); pointer-events: none; z-index: 0; }
        .mic-panel-container { background: rgba(30, 31, 32, 0.4); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 8px 32px rgba(0, 0, 0, 0.5); transition: all 0.3s ease; width: 100%; max-width: 52rem; border-radius: 1.5rem; padding: 2.5rem; display: flex; flex-direction: column; align-items: center; gap: 1.5rem; }
        .live-pulse-indicator { animation: pulse 1.5s infinite ease-in-out; }
        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
          50% { transform: scale(1.05); box-shadow: 0 0 20px 10px rgba(239, 68, 68, 0); }
        }
        .mic-btn { transition: all 0.2s ease; cursor: pointer; }
        .mic-btn:hover { transform: scale(1.05); }
        @keyframes fade-up { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .results-card { animation: fade-up 0.4s ease-out forwards; }
      `}</style>

      <div className="bg-glow"></div>
      
      <div style={{ zIndex: 2, width: '100%', maxWidth: '52rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '350', color: '#e2e8f0', marginBottom: '2.5rem', textAlign: 'center', letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
          Real-Time Streaming Evaluation
        </h1>

        <div className="mic-panel-container">
          {isLiveStreaming ? (
            <button 
              onClick={stopRealtimeAnalysis} 
              className="mic-btn live-pulse-indicator" 
              style={{ width: '80px', height: '80px', borderRadius: '50%', border: 'none', backgroundColor: '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Square size={24} fill="#fff" />
            </button>
          ) : (
            <button 
              onClick={startRealtimeAnalysis} 
              className="mic-btn" 
              style={{ width: '80px', height: '80px', borderRadius: '50%', border: 'none', backgroundColor: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)' }}
            >
              <Mic size={24} />
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isLiveStreaming ? '#ef4444' : '#94a3b8', fontWeight: '600', fontSize: '1rem', letterSpacing: '0.05em' }}>
            <Radio size={18} className={isLiveStreaming ? "live-pulse-indicator" : ""} />
            {isLiveStreaming ? "STREAM ACTIVE — MONITORING CAPTURE" : "MICROPHONE STANDBY READY"}
          </div>

          {streamError && (
            <div style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem 1.5rem', borderRadius: '9999px', fontSize: '0.875rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              {streamError}
            </div>
          )}
        </div>

        {realtimeResult && (
          <div className="results-card" style={{ marginTop: '3rem', width: '100%', background: 'rgba(30, 31, 32, 0.6)', backdropFilter: 'blur(16px)', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem' }}>
              {realtimeResult.prediction === 'bonafide' ? (
                <ShieldCheck size={48} style={{ color: '#22c55e' }} />
              ) : (
                <ShieldAlert size={48} style={{ color: '#ef4444' }} />
              )}
              <div>
                <div style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8' }}>Live Audio Analysis</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: realtimeResult.prediction === 'bonafide' ? '#4ade80' : '#f87171' }}>
                  {realtimeResult.prediction === 'bonafide' ? "Human Signature Verified" : "Synthetic Spoof Footprint Flagged"}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#cbd5e1' }}>Bonafide Acoustic Match Integrity</span>
                  <span style={{ color: '#22c55e', fontWeight: '600' }}>{realtimeResult.bonafideScore}%</span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', backgroundColor: '#22c55e', width: `${realtimeResult.bonafideScore}%`, transition: 'width 0.2s ease-out' }}></div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#cbd5e1' }}>Neural Generation Footprint Vector</span>
                  <span style={{ color: '#ef4444', fontWeight: '600' }}>{realtimeResult.spoofScore}%</span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', backgroundColor: '#ef4444', width: `${realtimeResult.spoofScore}%`, transition: 'width 0.2s ease-out' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}