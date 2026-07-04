import React, { useState } from 'react';
import { User, Phone, Mail, Loader2, ArrowRight, X, ShieldCheck, Lock, LogIn, UserPlus, MapPin, AlertCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const HYDERABAD_WARDS = [
  'Ward 112 (Hitech City)',
  'Ward 80 (Charminar)',
  'Ward 95 (Khairatabad)',
  'Ward 101 (Jubilee Hills)',
  'Ward 120 (Kukatpally)',
  'Ward 85 (Koti & Abids)',
  'Ward 98 (Gachibowli)',
  'Ward 104 (Begumpet)'
];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export default function AuthModal({ initialTab = 'signin', onSignup, loading, onClose }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'signin' | 'signup'
  const [isCouncillorMode, setIsCouncillorMode] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [selectedWard, setSelectedWard] = useState('Ward 112 (Hitech City)');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Handle Google OAuth Success
  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setIsSending(true);
    try {
      if (API_BASE_URL) {
        const res = await fetch(`${API_BASE_URL}/auth/google-verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            credential: credentialResponse.credential,
            ward: selectedWard
          })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to verify Google identity.");
        }
        const userData = await res.json();
        onSignup(userData.name, userData.phone || userData.email, {
          id: userData.id,
          verified: true,
          loginType: 'google',
          email: userData.email,
          picture: userData.picture,
          ward: userData.ward || selectedWard,
          verifiedAt: new Date().toISOString()
        });
      } else {
        // Local dev fallback if backend offline
        const base64Url = credentialResponse.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const parsed = JSON.parse(jsonPayload);
        
        onSignup(parsed.name || 'Verified Google Citizen', parsed.email, {
          id: 'google-' + Date.now(),
          verified: true,
          loginType: 'google',
          email: parsed.email,
          picture: parsed.picture,
          ward: selectedWard,
          verifiedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error("Google verify error:", err);
      setError(err.message || "Failed to sign in with Google. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  // Handle Mobile + Password Sign Up
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!phone || phone.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsSending(true);
    try {
      if (API_BASE_URL) {
        const res = await fetch(`${API_BASE_URL}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, password, ward: selectedWard })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to create account.");
        }
        const userData = await res.json();
        onSignup(userData.name, userData.phone, {
          id: userData.id,
          verified: true,
          loginType: 'phone',
          ward: userData.ward || selectedWard,
          verifiedAt: new Date().toISOString()
        });
      } else {
        // Local dev fallback
        onSignup(name, phone, {
          id: 'citizen-' + Date.now(),
          verified: true,
          loginType: 'phone',
          ward: selectedWard,
          verifiedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      setError(err.message || "Error creating account.");
    } finally {
      setIsSending(false);
    }
  };

  // Handle Mobile + Password Sign In
  const handleSignin = async (e) => {
    e.preventDefault();
    setError('');
    if (!phone || phone.length < 10) {
      setError("Please enter your registered 10-digit mobile number.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsSending(true);
    try {
      if (API_BASE_URL) {
        const res = await fetch(`${API_BASE_URL}/auth/signin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, password })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Invalid mobile number or password.");
        }
        const userData = await res.json();
        onSignup(userData.name, userData.phone, {
          id: userData.id,
          verified: true,
          loginType: 'phone',
          ward: userData.ward || 'Ward 112 (Hitech City)',
          verifiedAt: new Date().toISOString()
        });
      } else {
        // Local dev fallback
        onSignup("Verified Citizen", phone, {
          id: 'citizen-' + Date.now(),
          verified: true,
          loginType: 'phone',
          ward: 'Ward 112 (Hitech City)',
          verifiedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      setError(err.message || "Invalid mobile number or password.");
    } finally {
      setIsSending(false);
    }
  };

  // Handle Councillor Portal Sign In
  const handleCouncillorSignin = async (e) => {
    e.preventDefault();
    setError('');
    if (!phone || phone.length < 10) {
      setError("Please enter your 10-digit registered number.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsSending(true);
    try {
      let finalPhone = phone;
      if (!finalPhone.startsWith('+91')) {
        finalPhone = '+91' + finalPhone;
      }

      if (API_BASE_URL) {
        const res = await fetch(`${API_BASE_URL}/auth/councillor/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: finalPhone, password })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Invalid councillor mobile number or password.");
        }
        const data = await res.json();
        onSignup(data.name, data.phone, {
          id: data.id,
          verified: true,
          loginType: 'councillor',
          ward: data.ward,
          role: 'councillor',
          verifiedAt: new Date().toISOString()
        });
      } else {
        // Fallback Mock Logic
        const mockCouncillors = [
          { id: 'c1', name: "Sri Ch. Ram Mohan", phone: "+919440011200", ward: "Ward 112 (Hitech City)", password_hash: "councillor112" },
          { id: 'c2', name: "Smt. P. Vijaya Lakshmi", phone: "+919440009500", ward: "Ward 95 (Khairatabad)", password_hash: "councillor95" },
          { id: 'c3', name: "Sri K. Venkatesh", phone: "+919440008000", ward: "Ward 80 (Charminar)", password_hash: "councillor80" },
          { id: 'c4', name: "Sri V. Krishna Mohan", phone: "+919440010100", ward: "Ward 101 (Jubilee Hills)", password_hash: "councillor101" },
          { id: 'c5', name: "Sri M. Satyanarayana", phone: "+919440012000", ward: "Ward 120 (Kukatpally)", password_hash: "councillor120" },
          { id: 'c6', name: "Smt. K. Saritha", phone: "+919440008500", ward: "Ward 85 (Koti)", password_hash: "councillor85" }
        ];
        const found = mockCouncillors.find(c => c.phone === finalPhone && c.password_hash === password);
        if (found) {
          onSignup(found.name, found.phone, {
            id: found.id,
            verified: true,
            loginType: 'councillor',
            ward: found.ward,
            role: 'councillor',
            verifiedAt: new Date().toISOString()
          });
        } else {
          throw new Error("Invalid councillor mobile number or password.");
        }
      }
    } catch (err) {
      setError(err.message || "Invalid credentials.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xs w-full p-5 shadow-2xl relative overflow-hidden text-left bg-linear-to-b from-white to-slate-50/50">
        
        {/* Close Button */}
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header Branding */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-md shrink-0 text-white ${
            isCouncillorMode 
              ? 'bg-gradient-to-tr from-emerald-500 to-teal-600 shadow-emerald-500/20' 
              : 'bg-gradient-to-tr from-orange-500 to-red-600 shadow-orange-500/20'
          }`}>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-display font-black text-slate-800 leading-tight">Bharat Patrol</h2>
            <p className="text-[10px] font-mono text-slate-400 tracking-wider uppercase">
              {isCouncillorMode ? "Councillor Portal" : "Citizen Identity"}
            </p>
          </div>
        </div>

        {/* Top Navigation Tabs: SIGN IN vs SIGN UP (hidden in councillor mode) */}
        {!isCouncillorMode && (
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200/80 mb-4 font-mono text-xs font-bold">
            <button
              type="button"
              onClick={() => { setActiveTab('signin'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'signin'
                  ? 'bg-white text-slate-800 shadow-2xs font-extrabold border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('signup'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'signup'
                  ? 'bg-white text-slate-800 shadow-2xs font-extrabold border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Sign Up
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-600 text-[11px] font-medium animate-shake">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* 1-Click Google OAuth Section (hidden in councillor mode) */}
        {!isCouncillorMode && (
          <div className="mb-4 flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google Sign-In failed. Please try again.")}
              theme="outline"
              shape="rectangular"
              size="medium"
              width="280"
              text={activeTab === 'signin' ? "signin_with" : "signup_with"}
            />
          </div>
        )}

        {/* Divider (hidden in councillor mode) */}
        {!isCouncillorMode && (
          <div className="relative flex items-center justify-center mb-4">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-2 text-[9px] font-mono font-extrabold uppercase tracking-widest text-slate-400 absolute">
              or mobile
            </span>
          </div>
        )}

        {/* TAB 1: SIGN IN FORM */}
        {(activeTab === 'signin' || isCouncillorMode) && (
          <form onSubmit={isCouncillorMode ? handleCouncillorSignin : handleSignin} className="space-y-3 font-sans">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                  +91
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit number"
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium text-xs focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-slate-400"
                />
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium text-xs focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-slate-400"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || isSending}
              className={`w-full py-2.5 px-4 rounded-xl font-mono font-extrabold text-xs uppercase tracking-wider text-white shadow-md flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 mt-1 cursor-pointer ${
                isCouncillorMode 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-emerald-500/15'
                  : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 shadow-orange-500/15'
              }`}
            >
              {loading || isSending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{isCouncillorMode ? "Verifying..." : "Signing In..."}</span>
                </>
              ) : (
                <>
                  <span>{isCouncillorMode ? "Councillor Login" : "Sign In"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: SIGN UP FORM */}
        {!isCouncillorMode && activeTab === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-2.5 font-sans">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Citizen Name"
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium text-xs focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-slate-400"
                />
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                  +91
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit number"
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium text-xs focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-slate-400"
                />
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                Create Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6+ characters"
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium text-xs focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-slate-400"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                Primary Municipal Ward
              </label>
              <div className="relative">
                <select
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium text-xs focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all appearance-none cursor-pointer"
                >
                  {HYDERABAD_WARDS.map(w => (
                    <option key={w} value={w} className="bg-white text-slate-800">{w}</option>
                  ))}
                </select>
                <MapPin className="w-3.5 h-3.5 text-orange-500 absolute left-2.5 top-2 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || isSending}
              className="w-full py-2 px-4 rounded-xl font-mono font-extrabold text-xs uppercase tracking-wider bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-400 hover:to-red-500 shadow-md shadow-orange-500/15 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading || isSending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Bottom Switcher */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-center flex flex-col gap-1.5">
          {isCouncillorMode ? (
            <p className="text-[11px] text-slate-500">
              Are you a citizen?{' '}
              <button
                type="button"
                onClick={() => { setIsCouncillorMode(false); setActiveTab('signin'); setError(''); }}
                className="text-orange-600 hover:text-orange-700 font-bold underline underline-offset-2 ml-0.5 cursor-pointer font-sans"
              >
                Sign In as Citizen
              </button>
            </p>
          ) : (
            <>
              {activeTab === 'signin' ? (
                <p className="text-[11px] text-slate-500">
                  No account?{' '}
                  <button
                    type="button"
                    onClick={() => { setActiveTab('signup'); setError(''); }}
                    className="text-orange-600 hover:text-orange-700 font-bold underline underline-offset-2 ml-0.5 cursor-pointer font-sans"
                  >
                    Sign Up
                  </button>
                </p>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setActiveTab('signin'); setError(''); }}
                    className="text-orange-600 hover:text-orange-700 font-bold underline underline-offset-2 ml-0.5 cursor-pointer font-sans"
                  >
                    Sign In
                  </button>
                </p>
              )}
              <p className="text-[11px] text-slate-500 pt-1.5 border-t border-slate-100/50">
                Are you a Ward Councillor?{' '}
                <button
                  type="button"
                  onClick={() => { setIsCouncillorMode(true); setError(''); }}
                  className="text-emerald-600 hover:text-emerald-700 font-bold underline underline-offset-2 ml-0.5 cursor-pointer font-sans"
                >
                  Councillor Portal
                </button>
              </p>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
