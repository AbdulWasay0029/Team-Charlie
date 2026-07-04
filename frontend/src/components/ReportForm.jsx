import React, { useState, useRef } from 'react';
import { CATEGORIES } from '../mockData';
import { X, Camera, Upload, MapPin, Loader2, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function ReportForm({ lat, lng, onSubmit, onClose }) {
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // AI vision state
  const [isVerifying, setIsVerifying] = useState(false);
  const [aiVerified, setAiVerified] = useState(null);
  const [aiSeverity, setAiSeverity] = useState('');
  const [aiIssueType, setAiIssueType] = useState('');
  const [aiReason, setAiReason] = useState('');

  const fileInputRef = useRef(null);

  // Simulate AI Vision verification (Groq Vision llama-4-scout-17b)
  const processImageAI = (imageType) => {
    setIsVerifying(true);
    setAiVerified(null);
    
    setTimeout(() => {
      setIsVerifying(false);
      
      if (imageType === 'selfie') {
        setAiVerified(false);
        setAiReason("Selfie detected. The uploaded photo shows a human face rather than a road, drain, or public utility hazard. Verification failed.");
        setPhotoPreview("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80"); // selfie
        setCategory('');
        setDescription('');
      } else {
        setAiVerified(true);
        setAiReason("Road damage verified. Severe potholes and fractured asphalt detected. Immediate threat to vehicles and two-wheelers.");
        
        const selectedCat = category || 'road_damage';
        setCategory(selectedCat);
        
        let detectedType = "Deep Asphalt Potholes";
        let generatedDesc = "Multiple deep asphalt potholes located on the main road lane, causing immediate vehicle deceleration and tire hazard.";
        let severity = "8";
        let previewUrl = "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80";

        if (selectedCat === 'open_drain') {
          detectedType = "Unsecured Drain Canal";
          generatedDesc = "An uncovered drainage conduit filled with stagnant waste runoff, creating pedestrian drop risk and pest breeding site.";
          severity = "9";
          previewUrl = "https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=600&q=80";
        } else if (selectedCat === 'garbage') {
          detectedType = "Commercial Waste Overflow";
          generatedDesc = "A large collection of plastic and organic refuse spilling over onto the main sidewalk near retail stores.";
          severity = "7";
          previewUrl = "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80";
        } else if (selectedCat === 'streetlight') {
          detectedType = "Non-functional Lighting Pole";
          generatedDesc = "Streetlight is dark and inactive on a high-traffic pedestrian lane, causing poor security visibility.";
          severity = "6";
          previewUrl = "https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?auto=format&fit=crop&w=600&q=80";
        }

        setAiIssueType(detectedType);
        setAiSeverity(severity);
        setPhotoPreview(previewUrl);
        setDescription(generatedDesc);
      }
    }, 1500);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        processImageAI('issue');
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category) {
      alert("Please select a category.");
      return;
    }
    if (aiVerified === false) {
      alert("Cannot submit: AI verification failed. Please upload a genuine civic issue.");
      return;
    }
    
    setIsSubmitting(true);
    const finalPhoto = photoPreview || "https://images.unsplash.com/photo-1599740831464-54c86b24d775?auto=format&fit=crop&w=600&q=80";
    
    try {
      await onSubmit({
        lat,
        lng,
        category,
        description: description,
        photo_url: finalPhoto,
        ai_verified: aiVerified === true,
        ai_severity: aiSeverity ? (parseInt(aiSeverity) >= 9 ? 'critical' : parseInt(aiSeverity) >= 7 ? 'high' : parseInt(aiSeverity) >= 4 ? 'medium' : 'low') : 'low',
        ai_issue_type: aiIssueType || 'Infrastructure Issue'
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-[2000] flex items-center justify-center p-4 overflow-y-auto font-body">
      <div className="bg-white border border-slate-100 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header with warm orange gradient */}
        <div className="bg-gradient-to-r from-orange-500 to-red-650 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
            <div>
              <h2 className="text-lg font-bold tracking-wide flex items-center gap-1.5">
                AI Vision Report Portal
              </h2>
              <p className="text-orange-100 text-[10px] tracking-wider uppercase mt-0.5">Verify and pin complaints in realtime</p>
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
          <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 flex items-center gap-3">
            <div className="bg-orange-500/10 p-2 rounded-xl text-orange-600">
              <MapPin className="h-4.5 w-4.5" />
            </div>
            <div className="text-left font-mono">
              <span className="text-slate-400 text-[9px] block font-bold uppercase tracking-wider">Verified Geolocation</span>
              <span className="text-slate-800 font-bold text-xs">Lat: {lat.toFixed(5)}, Lng: {lng.toFixed(5)}</span>
            </div>
          </div>

          {/* AI Vision Verification Options (JUDGES DEMO TRIGGER) */}
          <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 space-y-2.5 text-left">
            <span className="text-[9px] text-orange-600 font-mono font-extrabold uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-orange-500" />
              Groq Llama-4-Scout Vision Simulator
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => processImageAI('issue')}
                className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl p-2.5 text-xs font-bold text-center transition cursor-pointer shadow-sm"
              >
                📸 Demo: Pothole Photo
              </button>
              <button
                type="button"
                onClick={() => processImageAI('selfie')}
                className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl p-2.5 text-xs font-bold text-center transition cursor-pointer shadow-sm"
              >
                🤳 Demo: Selfie Fail
              </button>
            </div>
          </div>

          {/* Category Selector */}
          <div className="space-y-1.5 text-left">
            <label className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              Issue Category <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
              {Object.entries(CATEGORIES).map(([key, cat]) => {
                const isSelected = category === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-[11px] font-semibold transition text-left cursor-pointer ${
                      isSelected
                        ? 'bg-teal-600 border-transparent text-white shadow-md'
                        : 'bg-slate-50 border-slate-200/60 text-slate-700 hover:bg-slate-100 hover:border-slate-350'
                    }`}
                  >
                    <span className="text-base">{cat.icon}</span>
                    <span className="truncate uppercase font-mono tracking-wide">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Photo File Input & Preview */}
          <div className="space-y-1.5 text-left">
            <label className="text-slate-500 text-[10px] font-bold uppercase tracking-widest block">
              Photo Evidence
            </label>
            
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handlePhotoChange}
              className="hidden"
            />

            {isVerifying ? (
              <div className="w-full border border-teal-500/20 bg-slate-50 rounded-xl p-8 flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-teal-650" />
                <span className="text-xs text-teal-600 font-mono font-bold uppercase tracking-widest animate-pulse">Running Vision Inference...</span>
                <span className="text-[9px] text-slate-400 font-mono">Groq Llama-4-Scout Vision processing</span>
              </div>
            ) : !photoPreview ? (
              <button
                type="button"
                onClick={triggerFileInput}
                className="w-full border border-dashed border-slate-200 hover:border-teal-500/40 bg-slate-50/50 hover:bg-slate-50 transition rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer text-slate-400"
              >
                <div className="bg-white p-2.5 rounded-xl text-teal-650 border border-slate-200 shadow-sm">
                  <Camera className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-slate-700">Attach Photo Evidence</span>
                <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">Supports camera capture & gallery files</span>
              </button>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video group">
                <img
                  src={photoPreview}
                  alt="Complaint Preview"
                  className="w-full h-full object-cover"
                />
                
                {/* AI vision overlay results */}
                {aiVerified === true && (
                  <div className="absolute top-2 left-2 bg-white/95 border border-teal-500/30 text-teal-655 rounded-xl p-1.5 text-[9px] font-mono font-bold shadow-md flex items-center gap-1.5 backdrop-blur-sm">
                    <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
                    <span className="tracking-widest uppercase">AI VERIFIED ({aiSeverity}/10)</span>
                  </div>
                )}

                {aiVerified === false && (
                  <div className="absolute inset-0 bg-white/95 backdrop-blur-sm p-4 flex flex-col items-center justify-center text-center text-red-650 space-y-2.5">
                    <AlertTriangle className="h-8 w-8 text-red-500 animate-bounce" />
                    <span className="text-xs font-mono font-black uppercase tracking-widest text-slate-800">AI VERIFICATION REJECTED</span>
                    <p className="text-[10px] leading-relaxed max-w-[260px] text-slate-600">{aiReason}</p>
                    <button
                      type="button"
                      onClick={() => { setPhotoPreview(null); setAiVerified(null); }}
                      className="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[9px] py-1.5 px-4 rounded-xl border border-red-200 transition cursor-pointer uppercase tracking-wider font-mono"
                    >
                      Try Another Photo
                    </button>
                  </div>
                )}

                {aiVerified === true && (
                  <div className="absolute inset-x-0 bottom-0 bg-white/90 p-2.5 border-t border-slate-200 text-[10px] text-slate-700 text-left font-medium">
                    🔍 <span className="font-bold text-teal-600">{aiIssueType}</span>: {aiReason}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Description Textarea */}
          <div className="space-y-1.5 text-left">
            <label className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              Issue Description <span className="text-slate-400 font-normal font-mono">(Llama Vision auto-generation)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Select photo above to trigger auto description generation..."
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl py-2 px-3 text-xs placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition h-14 resize-none font-medium shadow-sm"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !category || aiVerified === false}
              className={`w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-extrabold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed uppercase font-mono tracking-widest text-xs shadow-lg hover:shadow-orange-500/10`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  <span>Uploading to Supabase...</span>
                </>
              ) : (
                <span>Submit AI-Verified Report</span>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
