/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, ShieldCheck, Key, Eye, EyeOff, User } from 'lucide-react';
import { motion } from 'motion/react';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  adminUser: string;
  adminPass: string;
}

export default function AdminLogin({ onLoginSuccess, adminUser, adminPass }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username.trim() === adminUser && password === adminPass) {
      // Success! Play sound if possible and trigger login callback
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (typeof AudioCtx === 'function') {
          const audioCtx = new (AudioCtx as any)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.frequency.setValueAtTime(880, audioCtx.currentTime); // high note
          gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.15);
        }
      } catch (err) {}
      onLoginSuccess();
    } else {
      setError('Username atau Password salah! Mohon periksa kembali.');
    }
  };

  return (
    <div className="max-w-md mx-auto my-12">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border-2 border-blue-100 shadow-xl overflow-hidden p-8 space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 border-2 border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
            <Lock className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h2 className="font-sans font-black text-xl text-slate-800 uppercase tracking-wider">
            Verifikasi Admin
          </h2>
          <p className="text-xs text-slate-500 font-bold leading-relaxed max-w-xs mx-auto">
            Masukkan kredensial keamanan Anda untuk masuk ke panel pengelolaan billing internet.
          </p>
        </div>

        {/* Prominent Default Credentials Box */}
        <div className="bg-blue-50/80 border-2 border-blue-150 rounded-2xl p-4 text-center space-y-2.5 shadow-xs">
          <p className="text-[10px] text-blue-800 font-black uppercase tracking-wider">
            🔑 KREDENSIAL DEFAULT ADMIN
          </p>
          <div className="flex justify-center items-center gap-6 text-xs text-slate-700">
            <div>
              <span className="text-[9px] text-slate-400 block font-sans font-bold uppercase tracking-wider mb-0.5">USERNAME</span>
              <strong className="text-blue-700 font-mono font-black bg-blue-100/80 border border-blue-200 px-3 py-1 rounded-lg text-sm select-all">
                admin
              </strong>
            </div>
            <div className="h-8 border-l border-blue-200" />
            <div>
              <span className="text-[9px] text-slate-400 block font-sans font-bold uppercase tracking-wider mb-0.5">PASSWORD</span>
              <strong className="text-blue-700 font-mono font-black bg-blue-100/80 border border-blue-200 px-3 py-1 rounded-lg text-sm select-all">
                admin
              </strong>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border-2 border-rose-200 text-rose-700 text-xs font-bold p-3.5 rounded-2xl flex items-center gap-2 animate-shake">
            <ShieldCheck className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
              Username Admin
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="w-full text-xs font-bold bg-slate-50/50 border-2 border-slate-200 focus:border-blue-500 hover:border-slate-300 rounded-xl py-3 pl-10 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
              Password Keamanan
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Key className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full text-xs font-bold bg-slate-50/50 border-2 border-slate-200 focus:border-blue-500 hover:border-slate-300 rounded-xl py-3 pl-10 pr-10 text-slate-800 placeholder-slate-400 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-widest mt-6"
          >
            <ShieldCheck className="w-4 h-4 text-white" />
            Buka Panel Admin
          </button>
        </form>

        <div className="text-center text-[10px] text-slate-400 font-medium">
          Default username & password adalah <span className="font-bold text-slate-600">admin</span>. Kredensial dapat diubah setelah login di tab pengaturan.
        </div>
      </motion.div>
    </div>
  );
}
