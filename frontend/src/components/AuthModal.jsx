import React, { useState } from 'react';
import { Phone, CheckCircle2, ShieldAlert, Loader2, ArrowRight } from 'lucide-react';

export default function AuthModal({ onLogin, onClose }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1 = input phone, 2 = input OTP
  const [loading, setLoading] = useState(false);

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
      alert("Invalid OTP! Enter the demo code '123456'.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin({
        id: `usr_${phone.slice(-4)}`,
        phone: phone,
        name: `Citizen User (${phone.slice(-4)})`,
        role: 'citizen',
        ward: 'Ward 112 (Hitech City)'
      });
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[3000] flex items-center justify-center p-4 font-body">
      <div className="bg-white border border-slate-100 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Banner with MY CURE style header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 text-center text-white">
          <h2 className="text-xl font-bold tracking-wide uppercase">Citizen Authentication</h2>
          <p className="text-xs text-orange-100 mt-1 font-mono tracking-wider uppercase">OTP verification via Supabase Auth</p>
        </div>

        <div className="p-6 space-y-4 bg-slate-50/50">
          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="text-left space-y-1.5">
                <label className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">
                  Enter Mobile Number
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
                    className="w-full bg-white border border-slate-200 text-slate-850 rounded-xl py-3.5 pl-12 pr-4 text-sm font-semibold tracking-widest placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition font-mono shadow-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-orange-500/10 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 uppercase font-mono tracking-widest text-xs"
              >
                {loading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <span>Send OTP</span>}
                <ArrowRight className="h-4.5 w-4.5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="bg-slate-100 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3">
                <Phone className="h-4.5 w-4.5 text-teal-600 shrink-0" />
                <div className="text-left font-mono">
                  <span className="text-[8px] text-slate-400 block font-semibold uppercase tracking-wider">OTP sent to</span>
                  <span className="text-xs text-slate-700 font-bold tracking-widest">+91 {phone}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="ml-auto text-[9px] text-orange-500 font-bold hover:underline cursor-pointer tracking-widest font-mono uppercase"
                >
                  Edit
                </button>
              </div>

              <div className="text-left space-y-1.5">
                <label className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">
                  Verify OTP Code <span className="text-slate-400 font-normal font-mono">(Demo: enter 123456)</span>
                </label>
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                  placeholder="------"
                  maxLength={6}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl py-3 px-4 text-center text-lg font-black tracking-[0.6em] placeholder:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition font-mono shadow-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-teal-500/10 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 uppercase font-mono tracking-widest text-xs"
              >
                {loading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <span>Verify OTP</span>}
              </button>
            </form>
          )}

          <button
            onClick={onClose}
            className="w-full text-center text-[10px] font-bold font-mono tracking-widest text-slate-400 hover:text-slate-600 transition cursor-pointer uppercase"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
