import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cropAPI } from '../services/api';
import toast from 'react-hot-toast';

const DISEASES = {
  'Early Blight':    { treatment: 'Apply copper-based fungicide every 7 days. Remove affected leaves immediately.', prevention: 'Rotate crops annually. Avoid overhead watering. Maintain proper spacing.' },
  'Late Blight':     { treatment: 'Use Metalaxyl + Mancozeb fungicide. Destroy infected plants immediately.', prevention: 'Use resistant varieties. Ensure good air circulation. Avoid wet foliage.' },
  'Leaf Spot':       { treatment: 'Apply neem oil or copper hydroxide spray weekly.', prevention: 'Remove fallen leaves. Water at soil level. Avoid nitrogen over-fertilization.' },
  'Rust':            { treatment: 'Apply sulfur-based fungicide or triazole fungicide.', prevention: 'Plant rust-resistant varieties. Remove infected debris. Monitor humidity.' },
  'Mosaic Virus':    { treatment: 'No cure — remove infected plants to stop spread.', prevention: 'Control aphid vectors. Use virus-free seeds. Disinfect tools regularly.' },
  'Powdery Mildew':  { treatment: 'Spray potassium bicarbonate or sulfur fungicide.', prevention: 'Improve air circulation. Avoid high humidity. Water in morning hours.' },
  'Healthy':         { treatment: 'No treatment needed — crop looks healthy!', prevention: 'Maintain regular monitoring, watering schedule, and balanced fertilization.' },
};

export default function CropUpload() {
  const [dragOver, setDragOver] = useState(false);
  const [image, setImage]       = useState(null);   // { file, preview }
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const fileRef = useRef(null);

  const analyzeImage = useCallback(async (file) => {
    const preview = URL.createObjectURL(file);
    setImage({ file, preview });
    setResult(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await cropAPI.uploadImage(fd);
      
      if (res.data.error) {
        setResult(null);
        setImage(null);
        toast.error(res.data.error, { duration: 5000, icon: '🚫' });
      } else {
        setResult(res.data);
        toast.success(`Analysis complete: ${res.data.disease}`);
      }
    } catch {
      // Demo fallback when backend not connected
      const diseases = Object.keys(DISEASES);
      const randomDisease = diseases[Math.floor(Math.random() * (diseases.length - 1))];
      const confidence = (Math.random() * 0.25 + 0.72).toFixed(3);
      setResult({
        disease: randomDisease,
        confidence: parseFloat(confidence),
        treatment: DISEASES[randomDisease].treatment,
        prevention: DISEASES[randomDisease].prevention,
        model: 'PlantVillage-CNN (demo)',
        offline: true,
      });
      toast('Demo mode — connect backend for real AI analysis', { icon: '🔬' });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) analyzeImage(file);
    else toast.error('Please drop an image file');
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) analyzeImage(file);
    e.target.value = '';
  };

  const severityColor = (conf) => {
    if (result?.disease === 'Healthy') return { bg: '#E1F5EE', border: '#9FE1CB', text: '#0F6E56' };
    if (conf > 0.85) return { bg: '#FDE8E8', border: '#F5ACAC', text: '#9B2121' };
    if (conf > 0.70) return { bg: '#FAEEDA', border: '#F5CFA0', text: '#854F0B' };
    return { bg: '#E1F5EE', border: '#9FE1CB', text: '#0F6E56' };
  };

  return (
    <div className="content" style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.3px' }}>Crop Disease Scanner</h1>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>Upload a crop photo for instant AI-powered disease detection</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: image ? '1fr 1fr' : '1fr', gap: 20 }}>
        {/* Upload zone */}
        <motion.div layout>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !image && fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? '#1D9E75' : 'var(--color-border-tertiary)'}`,
              borderRadius: 16, background: dragOver ? 'rgba(29,158,117,0.04)' : 'var(--color-background-secondary)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: image ? 'default' : 'pointer', transition: 'all 0.2s',
              minHeight: 280, position: 'relative', overflow: 'hidden',
            }}
          >
            <AnimatePresence mode="wait">
              {image ? (
                <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <img src={image.preview} alt="Crop preview" style={{ width: '100%', height: 280, objectFit: 'cover', borderRadius: 14 }} />
                  <button
                    onClick={() => { setImage(null); setResult(null); }}
                    style={{
                      position: 'absolute', top: 10, right: 10,
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <i className="ti ti-x" style={{ fontSize: 14, color: '#fff' }} />
                  </button>
                  {loading && (
                    <div style={{
                      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
                      borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexDirection: 'column', gap: 12,
                    }}>
                      <i className="ti ti-loader-2" style={{ fontSize: 36, color: '#fff', animation: 'spin 1s linear infinite' }} />
                      <span style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>Analyzing with AI…</span>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: 32 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <i className="ti ti-leaf" style={{ fontSize: 28, color: '#1D9E75' }} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 6 }}>Drop crop image here</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
                    Supports JPG, PNG, WebP<br />Tomato, Potato, Wheat, Rice and more
                  </div>
                  <button className="btn-primary" onClick={() => fileRef.current?.click()}>
                    <i className="ti ti-upload" style={{ fontSize: 14 }} /> Upload Photo
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {image && !loading && (
            <button className="btn-secondary" style={{ width: '100%', marginTop: 10 }} onClick={() => fileRef.current?.click()}>
              <i className="ti ti-refresh" style={{ fontSize: 14, marginRight: 6 }} /> Upload Different Image
            </button>
          )}
        </motion.div>

        {/* Result panel */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div key="result" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <div style={{
                padding: '16px',
                borderRadius: 16,
                border: `0.5px solid ${severityColor(result.confidence).border}`,
                background: severityColor(result.confidence).bg,
                marginBottom: 14,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: severityColor(result.confidence).text }}>{result.disease}</div>
                    {result.offline && <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontFamily: 'JetBrains Mono' }}>demo mode</span>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: severityColor(result.confidence).text, fontFamily: 'JetBrains Mono' }}>
                      {Math.round(result.confidence * 100)}%
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>confidence</div>
                  </div>
                </div>
                {/* Confidence bar */}
                <div style={{ height: 4, background: 'rgba(255,255,255,0.5)', borderRadius: 2 }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.round(result.confidence * 100)}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{ height: '100%', background: severityColor(result.confidence).text, borderRadius: 2 }} />
                </div>
                {result.model && <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontFamily: 'JetBrains Mono', marginTop: 6 }}>Model: {result.model}</div>}
              </div>

              {/* Treatment */}
              <div className="panel" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="ti ti-first-aid-kit" style={{ fontSize: 14, color: '#185FA5' }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>Treatment</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>{result.treatment}</p>
              </div>

              {/* Prevention */}
              <div className="panel">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="ti ti-shield-check" style={{ fontSize: 14, color: '#0F6E56' }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>Prevention</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>{result.prevention}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Supported crops info */}
      <div className="panel">
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 14 }}>Supported Crops & Diseases</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {['🍅 Tomato', '🥔 Potato', '🌾 Wheat', '🌿 Rice', '🌽 Corn', '🍇 Grape', '🍎 Apple', '🫑 Pepper'].map(c => (
            <span key={c} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: '#E1F5EE', color: '#0F6E56', border: '0.5px solid #9FE1CB' }}>{c}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
