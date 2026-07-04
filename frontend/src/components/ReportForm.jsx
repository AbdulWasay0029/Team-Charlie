import React, { useState, useRef } from 'react';
import { CATEGORIES } from '../mockData';
import { X, Camera, Upload, MapPin, Loader2, Sparkles } from 'lucide-react';

export default function ReportForm({ lat, lng, onSubmit, onClose }) {
  const [category, setCategory] = useState('road_damage');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [compressing, setCompressing] = useState(false);

  const fileInputRef = useRef(null);

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
        
        // Scale down to max width 400px (keeps file size under 20-30kb)
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
        setPhotoUrl(base64); // send base64 data URL directly
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


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photoUrl) {
      alert("Please select or capture a photo.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        lat,
        lng,
        category,
        photo_url: photoUrl
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[3000] flex items-center justify-center p-4 overflow-y-auto font-body">
      <div className="bg-white border border-slate-100 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
            <div>
              <h2 className="text-lg font-bold tracking-wide">AI Civic Report</h2>
              <p className="text-orange-100 text-[10px] tracking-wider uppercase font-semibold">Verify and pin complaints in real-time</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Coordinates Info */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 flex items-center gap-3">
            <div className="bg-orange-500/10 p-2 rounded-xl text-orange-600 font-bold">
              <MapPin className="h-4.5 w-4.5" />
            </div>
            <div className="text-left font-mono">
              <span className="text-slate-400 text-[9px] block font-bold uppercase tracking-wider">Report Location</span>
              <span className="text-slate-800 font-extrabold text-xs">Lat: {lat.toFixed(5)}, Lng: {lng.toFixed(5)}</span>
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="space-y-1.5 text-left">
            <label className="text-slate-500 text-[10px] font-bold uppercase tracking-widest font-mono">
              Select Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-3 px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition cursor-pointer shadow-sm"
            >
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <option key={key} value={key}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Photo File Input */}
          <div className="space-y-1.5 text-left">
            <label className="text-slate-500 text-[10px] font-bold uppercase tracking-widest font-mono">
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
              <div className="w-full border border-teal-500/10 bg-slate-50 rounded-xl p-8 flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                <span className="text-xs text-teal-600 font-mono font-bold uppercase tracking-widest">Compressing Image...</span>
              </div>
            ) : !photoPreview ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="w-full border border-dashed border-slate-200 hover:border-teal-500/30 bg-slate-50/50 hover:bg-slate-50 transition rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer text-slate-400"
                >
                  <div className="bg-white p-2.5 rounded-xl text-teal-600 border border-slate-200 shadow-sm">
                    <Camera className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">Camera / Gallery Upload</span>
                  <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">Compresses file automatically</span>
                </button>

              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video group">
                <img
                  src={photoPreview}
                  alt="Evidence"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => { setPhotoPreview(null); setPhotoUrl(''); }}
                  className="absolute top-2 right-2 bg-slate-900/60 hover:bg-slate-900 text-white p-1 rounded-full cursor-pointer transition shadow-md"
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
              disabled={isSubmitting || compressing}
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-extrabold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed uppercase font-mono tracking-widest text-xs shadow-lg hover:shadow-orange-500/10"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  <span>Verifying Photo...</span>
                </>
              ) : (
                <span>Submit Complaint</span>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
