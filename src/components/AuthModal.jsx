import React, { useState } from 'react';
import { Phone, CheckCircle2, ShieldAlert, Loader2, ArrowRight } from 'lucide-react';

export default function AuthModal({ onLogin, onClose }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1 = input phone, 2 = input OTP
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('citizen'); // 'citizen' or 'official'

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      alert("Please enter a valid phone number.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1200);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otp !== '123456') {
      alert("Invalid OTP! Try entering the demo code '123456'.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin({
        id: `usr_${phone.slice(-4)}`,
        phone: phone,
        name: role === 'official' ? 'GHMC Official (Ward 104)' : `Citizen User (${phone.slice(-4)})`,
        role: role,
        ward: role === 'official' ? 'Ward 104 (Begumpet)' : 'Ward 112 (Hitech City)'
      });
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-lacquer-deep/80 backdrop-blur-sm z-[3000] flex items-center justify-center p-4 font-body">
      <div className="bg-raised-lacquer border border-white/10 w-full max-w-sm rounded-none shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Banner */}
        <div className="bg-lacquer-deep border-b border-kinpaku-gold p-6 text-center">
          <h2 className="text-2xl font-display font-light text-champagne tracking-wider uppercase">Supabase Secure Auth</h2>
          <p className="text-[9px] text-text-muted font-mono tracking-widest uppercase mt-0.5">One-Time Password (OTP) verification</p>
        </div>

        <div className="p-6 space-y-4">
          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="text-left space-y-1.5">
                <label className="text-text-muted text-[9px] font-mono font-extrabold uppercase tracking-widest block">
                  Select User Access Role
                </label>
                <div className="grid grid-cols-2 gap-2 font-mono text-[10px] uppercase tracking-widest">
                  <button
                    type="button"
                    onClick={() => setRole('citizen')}
                    className={`p-3 rounded-none border text-xs font-bold transition cursor-pointer ${
                      role === 'citizen'
                        ? 'bg-kinpaku-gold/10 border-kinpaku-gold text-kinpaku-gold'
                        : 'bg-graphite border-white/5 text-text-muted hover:text-champagne'
                    }`}
                  >
                    🙋 Citizen
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('official')}
                    className={`p-3 rounded-none border text-xs font-bold transition cursor-pointer ${
                      role === 'official'
                        ? 'bg-blue-900/10 border-blue-500 text-blue-400'
                        : 'bg-graphite border-white/5 text-text-muted hover:text-champagne'
                    }`}
                  >
                    🏢 GHMC Official
                  </button>
                </div>
              </div>

              <div className="text-left space-y-1.5">
                <label className="text-text-muted text-[9px] font-mono font-extrabold uppercase tracking-widest block">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-muted text-xs font-bold font-mono">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    maxLength={10}
                    className="w-full bg-lacquer-deep border border-white/10 text-champagne rounded-none py-3.5 pl-12 pr-4 text-sm font-semibold tracking-widest placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-kinpaku-gold focus:border-transparent transition font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full bg-kinpaku-gold hover:bg-kinpaku-pale text-lacquer-deep font-extrabold py-3.5 rounded-none shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 uppercase font-mono tracking-widest text-xs"
              >
                {loading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <span>Send OTP via SMS</span>}
                <ArrowRight className="h-4.5 w-4.5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="bg-lacquer-deep border border-white/5 rounded-none p-3.5 flex items-center gap-3">
                <Phone className="h-4.5 w-4.5 text-kinpaku-gold shrink-0" />
                <div className="text-left font-mono">
                  <span className="text-[8px] text-text-muted block font-semibold uppercase tracking-wider">OTP sent to</span>
                  <span className="text-xs text-champagne font-bold tracking-widest">+91 {phone}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="ml-auto text-[9px] text-kinpaku-gold font-bold hover:underline cursor-pointer tracking-widest font-mono uppercase"
                >
                  Edit
                </button>
              </div>

              <div className="text-left space-y-1.5">
                <label className="text-text-muted text-[9px] font-mono font-extrabold uppercase tracking-widest block">
                  Verify OTP Code <span className="text-text-faint font-normal font-mono">(Demo: enter 123456)</span>
                </label>
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                  placeholder="------"
                  maxLength={6}
                  className="w-full bg-lacquer-deep border border-white/10 text-champagne rounded-none py-3 px-4 text-center text-lg font-black tracking-[0.6em] placeholder:text-slate-800 focus:outline-none focus:ring-1 focus:ring-kinpaku-gold focus:border-transparent transition font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full bg-verdigris-patina hover:bg-patina-pale text-lacquer-deep font-extrabold py-3.5 rounded-none shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 uppercase font-mono tracking-widest text-xs"
              >
                {loading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <span>Verify OTP</span>}
              </button>
            </form>
          )}

          <button
            onClick={onClose}
            className="w-full text-center text-[10px] font-bold font-mono tracking-widest text-text-muted hover:text-champagne transition cursor-pointer uppercase"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
