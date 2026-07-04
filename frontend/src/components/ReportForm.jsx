import React, { useState, useRef } from 'react';
import { CATEGORIES } from '../mockData';
import { X, Camera, Upload, MapPin, Loader2, Sparkles, CheckCircle, RefreshCw } from 'lucide-react';

export default function ReportForm({ lat, lng, onSubmit, onClose, initialCategory }) {
  const [category, setCategory] = useState(initialCategory || 'road_damage');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [compressing, setCompressing] = useState(false);
  
  // Verification states: 'input' | 'checking' | 'verified'
  const [verificationState, setVerificationState] = useState('input');
  const [aiResult, setAiResult] = useState({ severity: 5, desc: '' });

  const fileInputRef = useRef(null);

  // Get dynamic AI result parameters for the preview card based on category
  const getAIResultPreview = (catKey) => {
    const details = {
      road_damage: { severity: 7, desc: "Multiple active pothole fractures detected in local driving lane. High risk of tire damage." },
      open_drain: { severity: 9, desc: "Uncovered structural manhole opening detected. Severe pedestrian safety risk." },
      streetlight: { severity: 5, desc: "Inactive dark sector lighting. High security hazard reported for nocturnal traffic." },
      garbage: { severity: 6, desc: "Municipal bio-waste overflow. Secondary hazard: stagnant water accumulation." },
      water_leak: { severity: 6, desc: "Fractured pipeline causing sidewalk flooding. Clean water wastage." },
      encroachment: { severity: 4, desc: "Unauthorized roadside stall blocking pedestrian right-of-way." },
      fallen_tree: { severity: 8, desc: "Fallen foliage blocking two-way thoroughfare. Active tree limb hazards." },
      bus_stop: { severity: 3, desc: "Structural damage to bus terminal seating shelter. Minor cosmetic repair." }
    };
    return details[catKey] || { severity: 5, desc: "Civic hazard identified. AI inspection verification complete." };
  };

  // Compress image to base64 canvas under 100kb
  const handlePhotoFile = (file) => {
    setCompressing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        const MAX_WIDTH = 400;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const base64 = canvas.toDataURL('image/jpeg', 0.6);
        setPhotoPreview(base64);
        setPhotoUrl(base64);
        setCompressing(false);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoFile(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const startAIVerification = (e) => {
    e.preventDefault();
    if (!photoUrl) {
      alert("Please select or capture a photo first.");
      return;
    }

    setVerificationState('checking');
    
    // Simulate Vision API Check
    setTimeout(() => {
      const result = getAIResultPreview(category);
      setAiResult(result);
      setVerificationState('verified');
    }, 1800);
  };

  const handleFinalSubmit = async () => {
    try {
      await onSubmit({
        lat,
        lng,
        category,
        photo_url: photoUrl
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[3000] flex items-center justify-center p-4 overflow-y-auto font-body">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-orange-500" />
            <div>
              <h2 className="text-sm font-display font-black tracking-wider uppercase text-slate-100">AI Grievance Validator</h2>
              <p className="text-slate-400 text-[9px] tracking-wider uppercase font-mono">Verify and pin complaints in real-time</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 p-1.5 rounded-full transition cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* 1. INPUT FORM STATE */}
        {verificationState === 'input' && (
          <form onSubmit={startAIVerification} className="p-6 space-y-4">
            
            {/* Coordinates Info */}
            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-3 flex items-center gap-3">
              <div className="bg-orange-500/10 p-2 rounded-xl text-orange-500 font-bold">
                <MapPin className="h-4.5 w-4.5" />
              </div>
              <div className="text-left font-mono">
                <span className="text-slate-500 text-[9px] block font-bold uppercase tracking-wider">Report Location</span>
                <span className="text-slate-200 font-extrabold text-xs">Lat: {lat.toFixed(5)}, Lng: {lng.toFixed(5)}</span>
              </div>
            </div>

            {/* Category Dropdown */}
            <div className="space-y-1.5 text-left">
              <label className="text-slate-400 text-[9px] font-bold uppercase tracking-widest font-mono">
                Select Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-250 rounded-xl py-3 px-3 text-xs font-semibold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition cursor-pointer shadow-sm"
              >
                {Object.entries(CATEGORIES).map(([key, cat]) => (
                  <option key={key} value={key} className="bg-slate-950 text-slate-200">
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Photo File Input */}
            <div className="space-y-1.5 text-left">
              <label className="text-slate-400 text-[9px] font-bold uppercase tracking-widest font-mono">
                Evidence Photo
              </label>

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />

              {compressing ? (
                <div className="w-full border border-orange-500/10 bg-slate-950 rounded-xl p-8 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                  <span className="text-[10px] text-orange-500 font-mono font-bold uppercase tracking-widest">Compressing Image...</span>
                </div>
              ) : !photoPreview ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    className="w-full border border-dashed border-slate-800 hover:border-orange-500/20 bg-slate-950 hover:bg-slate-950/80 transition rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer text-slate-400 shadow-inner"
                  >
                    <div className="bg-slate-900 p-2.5 rounded-xl text-orange-500 border border-slate-800 shadow-sm">
                      <Camera className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-300">Camera / Gallery Upload</span>
                    <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Compresses file automatically</span>
                  </button>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video group">
                  <img
                    src={photoPreview}
                    alt="Evidence"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => { setPhotoPreview(null); setPhotoUrl(''); }}
                    className="absolute top-2 right-2 bg-slate-950/80 hover:bg-slate-950 text-white p-1 rounded-full cursor-pointer transition shadow-md border border-slate-850"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={compressing}
                className="w-full bg-gradient-to-r from-orange-500 to-red-650 hover:from-orange-450 hover:to-red-550 text-white font-extrabold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed uppercase font-mono tracking-widest text-xs shadow-lg hover:shadow-orange-500/10"
              >
                <span>Inspect with AI Vision</span>
              </button>
            </div>

          </form>
        )}

        {/* 2. LOADING STATE */}
        {verificationState === 'checking' && (
          <div className="p-8 text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-orange-500 mx-auto" />
            <h3 className="font-display font-black text-sm text-slate-100">TraceSpark AI is validating photo integrity...</h3>
            <p className="text-[10px] font-mono text-slate-550 uppercase tracking-widest animate-pulse font-bold">Running Llama 4 Vision analysis...</p>
          </div>
        )}

        {/* 3. VERIFIED CARD STATE */}
        {verificationState === 'verified' && (
          <div className="p-6 space-y-5 text-left text-slate-100">
            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 p-3 rounded-2xl">
              <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
              <div className="text-left leading-tight">
                <h4 className="font-display font-black text-xs uppercase text-emerald-400">Issue Verified: {CATEGORIES[category]?.label}</h4>
                <span className="text-[8px] font-mono text-emerald-500 uppercase tracking-wider mt-0.5 block font-bold">Llama Vision Analysis Succeeded</span>
              </div>
            </div>

            <div className="space-y-3 font-sans text-xs bg-slate-950 p-4 rounded-2xl border border-slate-850">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-450">AI Severity Rating</span>
                <span className="font-extrabold font-mono text-sm text-orange-500">{aiResult.severity}/10</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-450">Priority Score Multiplier</span>
                <span className="font-extrabold font-mono text-emerald-400">x3 Boost</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-450 block font-bold uppercase text-[9px] font-mono tracking-wider">Inspection Summary</span>
                <p className="text-slate-300 leading-relaxed font-sans text-xs p-1">
                  {aiResult.desc}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setVerificationState('input')}
                className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl font-mono text-[10px] font-bold uppercase tracking-widest text-slate-300 transition cursor-pointer"
              >
                Re-Upload Photo
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="flex-1 py-2.5 px-3 bg-gradient-to-r from-orange-500 to-red-650 hover:from-orange-450 hover:to-red-550 text-white rounded-xl font-mono text-[10px] font-bold uppercase tracking-widest transition shadow-md shadow-orange-500/10 cursor-pointer"
              >
                Save & Lodge Pin
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
