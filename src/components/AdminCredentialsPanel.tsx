import React, { useState } from 'react';
import { User, Key, Save } from 'lucide-react';

interface AdminCredentialsPanelProps {
  adminUsername: string;
  adminPassword: string;
  onUpdateAdminCredentials: (user: string, pass: string) => void;
  showToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export default function AdminCredentialsPanel({
  adminUsername,
  adminPassword,
  onUpdateAdminCredentials,
  showToast,
}: AdminCredentialsPanelProps) {
  const [user, setUser] = useState(adminUsername);
  const [pass, setPass] = useState(adminPassword);

  const handleSave = () => {
    if (!user.trim() || !pass.trim()) {
      showToast('Username dan password tidak boleh kosong!', 'error');
      return;
    }
    onUpdateAdminCredentials(user.trim(), pass.trim());
    showToast('Kredensial admin berhasil diperbarui!', 'success');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
      
      <h3 className="font-sans font-bold text-sm text-slate-800 flex items-center gap-2 mb-1">
        <Key className="w-4 h-4 text-blue-600" />
        Pengaturan Akses Admin
      </h3>
      <p className="text-[11px] text-slate-500 font-medium mb-4">
        Ganti username dan password masuk Dashboard Admin demi keamanan sistem Anda.
      </p>

      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
            Username Baru
          </label>
          <div className="relative">
            <User className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg py-2 pl-8 pr-3 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              placeholder="admin"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
            Password Baru
          </label>
          <div className="relative">
            <Key className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg py-2 pl-8 pr-3 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:shadow"
        >
          <Save className="w-3.5 h-3.5" />
          Simpan Kredensial
        </button>
      </div>
    </div>
  );
}
