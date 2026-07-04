import React, { useState } from 'react';
import { User, Phone, Loader2, ArrowRight } from 'lucide-react';

export default function AuthModal({ onSignup, loading }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please enter your name.");
      return;
    }
    if (!phone || phone.length < 10) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }
    onSignup(name.trim(), phone.trim());
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-sky-100 via-slate-50 to-emerald-50 z-[5000] flex items-center justify-center p-4 font-body select-none">
      <div className="bg-white border border-slate-100 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-250 p-6 md:p-8 space-y-6">
        
        {/* Logo and Brand Heading */}
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="bg-gradient-to-tr from-orange-500 to-red-600 w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-500/10 font-display font-extrabold text-3xl">
              BP
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-display font-extrabold tracking-tight text-slate-900 uppercase">
              Join Bharat Patrol
            </h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider font-mono">
              India's first AI-verified civic accountability portal
            </p>
          </div>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div className="text-left space-y-1.5">
            <label className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block font-mono">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <User className="h-4.5 w-4.5 text-slate-450" />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sameer Ansari"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-3.5 pl-10 pr-4 text-sm font-semibold placeholder:text-slate-350 focus:outline-none focus:ring-2 focus:ring-teal-650 focus:border-transparent transition shadow-sm"
              />
            </div>
          </div>

          {/* Phone Field */}
          <div className="text-left space-y-1.5">
            <label className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block font-mono">
              Mobile Number
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-xs font-bold font-mono">
                +91
              </span>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="9876543210"
                maxLength={10}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-sm font-semibold tracking-widest placeholder:text-slate-350 focus:outline-none focus:ring-2 focus:ring-teal-650 focus:border-transparent transition font-mono shadow-sm"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || phone.length < 10 || !name.trim()}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-extrabold py-3.5 rounded-xl shadow-lg hover:shadow-orange-500/10 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 uppercase font-mono tracking-widest text-xs"
          >
            {loading ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                <span>Signing Up...</span>
              </>
            ) : (
              <>
                <span>Enter Portal</span>
                <ArrowRight className="h-4.5 w-4.5" />
              </>
            )}
          </button>
        </form>

        {/* Disclaimer / Information */}
        <p className="text-[9px] leading-relaxed text-slate-400 text-center font-mono">
          Your identity is required to coordinate upvotes, verify submissions, and dispatch verified escalations. We never share your data.
        </p>

      </div>
    </div>
  );
}
