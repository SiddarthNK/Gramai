import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function CropUpload() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  const resultRef = useRef(null);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null);
      setError(null);
    }
  };

  const scanDisease = async () => {
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/scan/disease`, {
        method: "POST",
        body: formData
      });
      
      const resData = await response.json();
      
      if (resData.success) {
        setResult(resData.data);
      } else {
        setError(resData.error || "Scan failed. Please try again.");
      }
      
    } catch (err) {
      console.error("Scanner error:", err);
      setError("Scanner failed. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto', height: '100%', overflowY: 'auto' }}>
      <style>{`
        .scanner-scroll-area::-webkit-scrollbar { width: 4px; }
        .scanner-scroll-area::-webkit-scrollbar-track { background: transparent; }
        .scanner-scroll-area::-webkit-scrollbar-thumb { background: #1D9E75; border-radius: 4px; }
        .scanner-scroll-area::-webkit-scrollbar-thumb:hover { background: #178F68; }
      `}</style>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>Crop Disease Scanner</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>Upload a photo of your crop's leaf for instant AI diagnosis and treatment.</p>
      </div>

      <div style={{ 
        background: 'var(--color-background-secondary)', 
        borderRadius: 16, 
        padding: 32, 
        border: '1px dashed var(--color-border-tertiary)',
        textAlign: 'center',
        marginBottom: 32
      }}>
        {!preview ? (
          <label style={{ cursor: 'pointer', display: 'block' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📸</div>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>Click to upload or drag and drop</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>JPG, PNG or WebP (max 10MB)</div>
            <input type="file" hidden onChange={handleFileChange} accept="image/*" />
          </label>
        ) : (
          <div>
            <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 250, borderRadius: 12, marginBottom: 20, objectFit: 'contain' }} />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button 
                onClick={() => { setFile(null); setPreview(null); setResult(null); }}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border-tertiary)', background: 'none', cursor: 'pointer', fontSize: 13 }}
              >
                Clear
              </button>
              <button 
                onClick={scanDisease}
                disabled={loading}
                style={{ 
                  padding: '8px 20px', borderRadius: 8, border: 'none', 
                  background: '#1D9E75', color: '#fff', fontWeight: 600, cursor: 'pointer',
                  opacity: loading ? 0.7 : 1, fontSize: 13
                }}
              >
                {loading ? 'Analyzing...' : 'Scan Now'}
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24, padding: 16, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12, color: '#991B1B', fontSize: 14 }}>
            ⚠️ {error}
          </motion.div>
        )}

        {result && (
          <motion.div 
            ref={resultRef}
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="scanner-scroll-area"
            style={{ 
              marginTop: 10,
              paddingBottom: 40,
              maxHeight: '70vh',
              overflowY: 'auto',
              padding: '4px 2px',
              scrollbarWidth: 'thin',
              scrollbarColor: '#1D9E75 transparent'
            }}
          >
            {!result.is_plant ? (
              <div style={{ padding: 24, background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🚫</div>
                <div style={{ fontWeight: 600, color: '#9A3412' }}>No plant detected</div>
                <div style={{ color: '#C2410C', fontSize: 13 }}>Please upload a clear plant photo.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', background: 'var(--color-background-secondary)', padding: 16, borderRadius: 16, border: '1px solid var(--color-border-tertiary)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--color-text-tertiary)', letterSpacing: 1, fontWeight: 700 }}>Detected Crop</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)' }}>{result.crop_detected}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--color-text-tertiary)', letterSpacing: 1, fontWeight: 700 }}>Condition</div>
                    <div style={{ 
                      fontSize: 16, fontWeight: 700, 
                      color: result.disease_detected === 'Healthy' ? '#10B981' : '#EF4444' 
                    }}>
                      {result.disease_detected}
                    </div>
                  </div>
                  <div style={{ padding: '6px 10px', borderRadius: 10, background: result.severity === 'Severe' ? '#FEF2F2' : '#F0FDF4', color: result.severity === 'Severe' ? '#EF4444' : '#10B981', fontWeight: 700, fontSize: 11 }}>
                    {result.severity}
                  </div>
                </div>

                {result.confidence < 60 && (
                  <div style={{ padding: 10, background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 8, color: '#92400E', fontSize: 12 }}>
                    ⚠️ Low confidence result ({result.confidence}%). Try a closer photo.
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Card title="Symptoms" content={result.symptoms} icon="🔍" />
                  <Card title="Causes" content={result.causes} icon="🧬" />
                </div>

                <div style={{ background: 'var(--color-background-secondary)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--color-border-tertiary)' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border-tertiary)', fontWeight: 600, fontSize: 14 }}>Treatment Options</div>
                  <div style={{ display: 'flex' }}>
                    <div style={{ flex: 1, padding: 16, borderRight: '1px solid var(--color-border-tertiary)' }}>
                      <div style={{ color: '#059669', fontWeight: 700, fontSize: 12, marginBottom: 6 }}>🌿 Organic Treatment</div>
                      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{result.organic_treatment}</div>
                    </div>
                    <div style={{ flex: 1, padding: 16 }}>
                      <div style={{ color: '#2563EB', fontWeight: 700, fontSize: 12, marginBottom: 6 }}>🧪 Chemical Treatment</div>
                      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{result.chemical_treatment}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Card title="Fertilizer Tip" content={result.fertilizer_tip} icon="🧪" />
                  <Card title="Prevention" content={result.prevention} icon="🛡️" />
                </div>

                <div style={{ background: '#EEF2FF', padding: 20, borderRadius: 16, border: '1px solid #C7D2FE', marginBottom: 20 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 20 }}>💡</div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#3730A3', marginBottom: 4, fontSize: 14 }}>Farmer Advice</div>
                      <div style={{ color: '#4338CA', fontSize: 13, lineHeight: 1.5 }}>{result.farmer_advice}</div>
                      <div style={{ marginTop: 10, fontSize: 11, color: '#6366F1', fontWeight: 600 }}>Estimate recovery: {result.recovery_estimate}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Card({ title, content, icon }) {
  return (
    <div style={{ background: 'var(--color-background-secondary)', padding: 16, borderRadius: 16, border: '1px solid var(--color-border-tertiary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: 13 }}>{title}</span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>{content}</div>
    </div>
  );
}
