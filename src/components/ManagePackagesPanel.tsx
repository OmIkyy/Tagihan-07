import React, { useState } from 'react';
import { Package, Plus, Trash2 } from 'lucide-react';
import { InternetPackage } from '../types';

interface ManagePackagesPanelProps {
  packages: InternetPackage[];
  onAddPackage: (pkg: InternetPackage) => void;
  onDeletePackage: (name: string) => void;
  showToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export default function ManagePackagesPanel({
  packages,
  onAddPackage,
  onDeletePackage,
  showToast,
}: ManagePackagesPanelProps) {
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgSpeed, setNewPkgSpeed] = useState('');
  const [newPkgPrice, setNewPkgPrice] = useState('');

  const handleCreatePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPkgName.trim() || !newPkgSpeed.trim() || !newPkgPrice.trim()) {
      showToast('Semua kolom paket harus diisi!', 'error');
      return;
    }

    const priceNum = parseInt(newPkgPrice.replace(/\D/g, ''), 10);
    if (isNaN(priceNum) || priceNum <= 0) {
      showToast('Harga paket tidak valid!', 'error');
      return;
    }

    // Check duplicate
    if (packages.some((p) => p.name.toUpperCase() === newPkgName.trim().toUpperCase())) {
      showToast('Nama paket sudah digunakan!', 'error');
      return;
    }

    onAddPackage({
      name: newPkgName.trim().toUpperCase(),
      speed: newPkgSpeed.trim(),
      price: priceNum,
    });

    setNewPkgName('');
    setNewPkgSpeed('');
    setNewPkgPrice('');
    showToast(`Paket "${newPkgName.trim().toUpperCase()}" berhasil dibuat!`, 'success');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
      
      <h3 className="font-sans font-bold text-sm text-slate-800 flex items-center gap-2 mb-3">
        <Package className="w-4 h-4 text-blue-600" />
        Kelola Paket Internet
      </h3>

      <div className="space-y-4">
        {/* Form */}
        <form onSubmit={handleCreatePackage} className="bg-slate-50/50 p-3 rounded-lg border border-slate-100 space-y-2.5">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            ➕ Tambah Paket Baru
          </h4>
          
          <div className="space-y-2">
            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                Nama Paket
              </label>
              <input
                type="text"
                required
                value={newPkgName}
                onChange={(e) => setNewPkgName(e.target.value)}
                placeholder="PAKET LITE"
                className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg py-1 px-2 focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                  Speed
                </label>
                <input
                  type="text"
                  required
                  value={newPkgSpeed}
                  onChange={(e) => setNewPkgSpeed(e.target.value)}
                  placeholder="10 Mbps"
                  className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-lg py-1 px-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                  Harga (Rp)
                </label>
                <input
                  type="text"
                  required
                  value={newPkgPrice}
                  onChange={(e) => setNewPkgPrice(e.target.value)}
                  placeholder="150000"
                  className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-lg py-1 px-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-semibold py-1.5 px-3 rounded-lg shadow-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Simpan Paket
          </button>
        </form>

        {/* List of active packages */}
        <div className="space-y-1.5">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            📋 Daftar Paket Aktif
          </h4>
          <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
            {packages.map((pkg) => (
              <div 
                key={pkg.name}
                className="bg-white border border-slate-200 rounded-lg p-2 flex justify-between items-center hover:border-slate-300 transition-all text-xs"
              >
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-800">{pkg.name}</p>
                  <div className="flex gap-1 text-[9px] text-slate-500 font-semibold">
                    <span>⚡ {pkg.speed}</span>
                    <span>•</span>
                    <span className="text-blue-600 font-bold">Rp {pkg.price.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Apakah Anda yakin ingin menghapus paket "${pkg.name}"?`)) {
                      onDeletePackage(pkg.name);
                      showToast(`Paket ${pkg.name} dihapus!`, 'success');
                    }
                  }}
                  disabled={packages.length <= 1}
                  className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer disabled:opacity-40"
                  title="Hapus Paket"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
