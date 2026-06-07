import React, { useState, useEffect } from 'react';
import { 
  auth, db 
} from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  collection, addDoc, query, where, orderBy, onSnapshot 
} from 'firebase/firestore';
import axios from 'axios';
import { Shield, Upload, History, LogOut, ShieldAlert, ShieldCheck, AudioLines, Loader2 } from 'lucide-react';

const API_URL = "https://mozmo-asvspoof-api.hf.space/predict";

export default function App() {
  const [user, setUser] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [uiError, setUiError] = useState('');

  // Synchronize User Authentication Loop
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setHistory([]);
    });
    return () => unsubscribe();
  }, []);

  // Synchronize Firestore History Pipeline
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
    }, (err) => {
      console.error("Firestore loading blocked. Ensure index generation completed.", err);
    });

    return () => unsubscribe();
  }, [user]);

  // Handle Authentication Submission Engine
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      }
    } catch (err) {
      setAuthError(err.message.replace("Firebase: ", ""));
    }
  };

  // Process Binary File Streams to Hugging Face
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

      // Persist results asynchronously to the user's history collection
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

  // Auth Layout Shell
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backgroundColor: '#0f172a' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '2.5rem', borderRadius: '1rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)', width: '100%', maxWidth: '28rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
            <div style={{ backgroundColor: '#1e1b4b', padding: '1rem', borderRadius: '9999px', color: '#6366f1', marginBottom: '1rem' }}>
              <Shield size={40} />
            </div>
            <h2 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#ffffff', textAlign: 'center' }}>ASVspoof 2021 Dashboard</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>Transformer-Driven Deepfake Voice Analyzer</p>
          </div>

          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '0.5rem' }}>Secure Email Address</label>
              <input type="email" required value={authEmail} onChange={e => setAuthEmail(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '0.5rem' }}>Password</label>
              <input type="password" required value={authPassword} onChange={e => setAuthPassword(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', outline: 'none' }} />
            </div>

            {authError && <div style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{authError}</div>}

            <button type="submit" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#4f46e5', color: '#ffffff', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' }}>
              {isRegistering ? "Register" : "Login"}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }} style={{ color: '#818cf8', fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              {isRegistering ? "Already registered? Login here" : "Don't have an account? Register now"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Master Dashboard Workspace
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc' }}>
      {/* Navigation Layer */}
      <nav style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #334155', padding: '1rem 2rem', display: 'flex', justifyContent: 'between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ color: '#6366f1' }}><AudioLines size={28} /></div>
          <span style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.025em' }}>Audio Forensics Workspace</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginLeft: 'auto' }}>
          <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Operator: <strong style={{ color: '#cbd5e1' }}>{user.email}</strong></span>
          <button onClick={() => signOut(auth)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.375rem', backgroundColor: '#334155', color: '#f1f5f9', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </nav>

      {/* Grid Dashboard Components */}
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        
        {/* Module A: Hardware Processing Hub */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ backgroundColor: '#1e293b', padding: '2rem', borderRadius: '1rem', border: '1px solid #334155' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Upload size={20} style={{ color: '#6366f1' }} /> Ingest Spectral Payload
            </h3>
            
            <form onSubmit={handleInferenceExecution}>
              <div style={{ border: '2px dashed #475569', borderRadius: '0.75rem', padding: '2rem', textAlign: 'center', backgroundColor: '#0f172a', transition: 'border-color 0.2s', marginBottom: '1.5rem' }}>
                <input type="file" accept=".wav,.flac,.mp3,.m4a" required onChange={e => setSelectedFile(e.target.files[0])} style={{ display: 'none' }} id="file-ingest" />
                <label htmlFor="file-ingest" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ color: '#94a3b8' }}><Upload size={32} /></div>
                  <span style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>{selectedFile ? selectedFile.name : "Select raw validation matrix (WAV, FLAC, MP3)"}</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Target sample length forced to 64600 samples</span>
                </label>
              </div>

              {uiError && <div style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{uiError}</div>}

              <button type="submit" disabled={isProcessing || !selectedFile} style={{ width: '100%', padding: '0.85rem', borderRadius: '0.5rem', backgroundColor: isProcessing ? '#334155' : '#4f46e5', color: '#ffffff', fontWeight: '600', cursor: selectedFile && !isProcessing ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', border: 'none' }}>
                {isProcessing ? (
                  <>
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Feeding Tensor Arrays...
                  </>
                ) : "Run Forensic Verification Passes"}
              </button>
            </form>
          </div>

          {/* Module B: Matrix Score Overlay */}
          {currentResult && (
            <div style={{ backgroundColor: '#1e293b', padding: '2rem', borderRadius: '1rem', border: '1px solid #334155', animation: 'fadeIn 0.3s ease-out' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>Statistical Verdict Matrix</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '0.75rem', backgroundColor: currentResult.prediction === 'bonafide' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: currentResult.prediction === 'bonafide' ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '1.5rem' }}>
                {currentResult.prediction === 'bonafide' ? (
                  <ShieldCheck size={36} style={{ color: '#22c55e' }} />
                ) : (
                  <ShieldAlert size={36} style={{ color: '#ef4444' }} />
                )}
                <div>
                  <div style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.05em', color: currentResult.prediction === 'bonafide' ? '#4ade80' : '#f87171' }}>Classification Target Match</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ffffff' }}>
                    {currentResult.prediction === 'bonafide' ? "Human Signature Verified" : "Synthetic Spoof Flagged"}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#94a3b8' }}>Bonafide Acoustic Target</span>
                    <span style={{ fontWeight: '600', color: '#22c55e' }}>{currentResult.confidence.bonafide}%</span>
                  </div>
                  <div style={{ height: '0.5rem', backgroundColor: '#0f172a', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', backgroundColor: '#22c55e', width: `${currentResult.confidence.bonafide}%` }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#94a3b8' }}>Neural Generation Footprint</span>
                    <span style={{ fontWeight: '600', color: '#ef4444' }}>{currentResult.confidence.spoof}%</span>
                  </div>
                  <div style={{ height: '0.5rem', backgroundColor: '#0f172a', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', backgroundColor: '#ef4444', width: `${currentResult.confidence.spoof}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Module C: Immutable Cloud History Log */}
        <div style={{ backgroundColor: '#1e293b', padding: '2rem', borderRadius: '1rem', border: '1px solid #334155', display: 'flex', flexDirection: 'column', maxHeight: '75vh' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={20} style={{ color: '#818cf8' }} /> Audit Trail Log History
          </h3>
          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, paddingRight: '0.25rem' }}>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '4rem 0', fontSize: '0.875rem' }}>No telemetry logging stored for current user tokens.</div>
            ) : (
              history.map((item) => (
                <div key={item.id} style={{ padding: '1rem', borderRadius: '0.5rem', backgroundColor: '#0f172a', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.filename}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>{item.timestamp?.toDate().toLocaleString() || "Just now"}</div>
                  </div>
                  <div style={{ textAlign: 'right', shrink: 0 }}>
                    <span style={{ display: 'inline-block', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', backgroundColor: item.prediction === 'bonafide' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: item.prediction === 'bonafide' ? '#4ade80' : '#f87171' }}>
                      {item.prediction}
                    </span>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                      {item.prediction === 'bonafide' ? `${item.bonafideScore}%` : `${item.spoofScore}%`}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}