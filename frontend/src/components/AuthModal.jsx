import React, { useState } from 'react';
import { User, Phone, Mail, Loader2, ArrowRight, X, ShieldCheck, KeyRound, CheckCircle2, AlertCircle, MapPin, Lock, LogIn, UserPlus } from 'lucide-react';
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

export default function AuthModal({ onSignup, loading, onClose }) {
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' | 'signup'
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

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[1000] p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-8 shadow-2xl relative overflow-hidden">
        
        {/* Background Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">TraceSpark Portal</h2>
          <p className="text-xs text-slate-400 mt-1">Official Municipal Citizen Identity & SLA Gateway</p>
        </div>

        {/* Top Navigation Tabs: SIGN IN vs SIGN UP */}
        <div className="flex rounded-xl bg-slate-950 p-1.5 border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => { setActiveTab('signin'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'signin'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('signup'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'signup'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Sign Up
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-400 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* 1-Click Google OAuth Section */}
        <div className="mb-6">
          <div className="flex justify-center w-full overflow-hidden rounded-xl shadow-md">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google Sign-In failed. Please try again.")}
              theme="filled_black"
              shape="pill"
              size="large"
              width="360"
              text={activeTab === 'signin' ? "signin_with" : "signup_with"}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center mb-6">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-900 px-3 text-[10px] font-black uppercase tracking-wider text-slate-500 absolute">
            or continue with mobile
          </span>
        </div>

        {/* TAB 1: SIGN IN FORM */}
        {activeTab === 'signin' && (
          <form onSubmit={handleSignin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Registered Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-bold text-sm">
                  +91
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-slate-600"
                />
                <Phone className="w-4 h-4 text-slate-600 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-4 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-slate-600"
                />
                <Lock className="w-4 h-4 text-slate-600 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || isSending}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading || isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: SIGN UP FORM */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-slate-600"
                />
                <User className="w-4 h-4 text-slate-600 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-bold text-sm">
                  +91
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full pl-12 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-slate-600"
                />
                <Phone className="w-4 h-4 text-slate-600 absolute right-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Create Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a 6+ character password"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-slate-600"
                />
                <Lock className="w-4 h-4 text-slate-600 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Primary Municipal Ward
              </label>
              <div className="relative">
                <select
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all appearance-none cursor-pointer"
                >
                  {HYDERABAD_WARDS.map(w => (
                    <option key={w} value={w} className="bg-slate-900 text-white">{w}</option>
                  ))}
                </select>
                <MapPin className="w-4 h-4 text-orange-500 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || isSending}
              className="w-full py-3 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4 cursor-pointer"
            >
              {loading || isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Citizen Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Bottom Switcher */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          {activeTab === 'signin' ? (
            <p className="text-xs text-slate-400">
              Don't have a citizen account?{' '}
              <button
                type="button"
                onClick={() => { setActiveTab('signup'); setError(''); }}
                className="text-orange-400 hover:text-orange-300 font-bold underline underline-offset-4 ml-1 cursor-pointer"
              >
                Create Account
              </button>
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setActiveTab('signin'); setError(''); }}
                className="text-orange-400 hover:text-orange-300 font-bold underline underline-offset-4 ml-1 cursor-pointer"
              >
                Sign In
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
