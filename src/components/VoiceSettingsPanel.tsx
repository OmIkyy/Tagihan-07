import React from 'react';
import { Volume2, VolumeX, Sliders, Play } from 'lucide-react';

interface VoiceSettingsPanelProps {
  isSpeechEnabled: boolean;
  setIsSpeechEnabled: (val: boolean) => void;
  selectedVoiceURI: string;
  setSelectedVoiceURI: (val: string) => void;
  voicesList: SpeechSynthesisVoice[];
  speechRate: number;
  setSpeechRate: (val: number) => void;
  speechPitch: number;
  setSpeechPitch: (val: number) => void;
  speechVolume: number;
  setSpeechVolume: (val: number) => void;
  testSpeechText: string;
  setTestSpeechText: (val: string) => void;
  speakText: (text: string) => void;
  showToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export default function VoiceSettingsPanel({
  isSpeechEnabled,
  setIsSpeechEnabled,
  selectedVoiceURI,
  setSelectedVoiceURI,
  voicesList,
  speechRate,
  setSpeechRate,
  speechPitch,
  setSpeechPitch,
  speechVolume,
  setSpeechVolume,
  testSpeechText,
  setTestSpeechText,
  speakText,
  showToast,
}: VoiceSettingsPanelProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-sm text-slate-800">
              Notifikasi Suara (TTS)
            </h3>
            <p className="text-[10px] text-slate-400">
              Ucapkan otomatis nama saat pembayaran lunas.
            </p>
          </div>
        </div>
        
        <button
          onClick={() => {
            setIsSpeechEnabled(!isSpeechEnabled);
            showToast(`Suara notifikasi ${!isSpeechEnabled ? 'diaktifkan' : 'dinonaktifkan'}`, 'info');
          }}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide cursor-pointer transition-all uppercase ${
            isSpeechEnabled
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200'
          }`}
        >
          {isSpeechEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          {isSpeechEnabled ? 'Aktif' : 'Mati'}
        </button>
      </div>

      <div className="space-y-4">
        {/* Sliders */}
        <div className="space-y-2.5 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
            <Sliders className="w-3 h-3" /> Parameter Audio
          </h4>
          
          <div className="grid grid-cols-1 gap-2 text-[11px]">
            {/* Speed Rate */}
            <div>
              <div className="flex justify-between text-slate-600 font-medium mb-0.5">
                <span>Kecepatan Bicara (Rate)</span>
                <span className="font-mono text-slate-800 font-bold">{speechRate}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={speechRate}
                onChange={(e) => setSpeechRate(Number(e.target.value))}
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Pitch */}
            <div>
              <div className="flex justify-between text-slate-600 font-medium mb-0.5">
                <span>Nada Suara (Pitch)</span>
                <span className="font-mono text-slate-800 font-bold">{speechPitch}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={speechPitch}
                onChange={(e) => setSpeechPitch(Number(e.target.value))}
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Volume */}
            <div>
              <div className="flex justify-between text-slate-600 font-medium mb-0.5">
                <span>Volume</span>
                <span className="font-mono text-slate-800 font-bold">{Math.round(speechVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={speechVolume}
                onChange={(e) => setSpeechVolume(Number(e.target.value))}
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Text Area for testing */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
            Uji Kalimat TTS
          </label>
          <textarea
            value={testSpeechText}
            onChange={(e) => setTestSpeechText(e.target.value)}
            className="w-full h-12 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg p-2 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            placeholder="Ketik kalimat uji suara..."
          />
        </div>

        <button
          onClick={() => {
            try {
              const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
              if (typeof AudioCtx === 'function') {
                const ctx = new (AudioCtx as any)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, ctx.currentTime);
                gain.gain.setValueAtTime(0.05, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.1);
              }
            } catch(e) {}
            
            speakText(testSpeechText);
            showToast('Memutar suara uji coba...', 'info');
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider text-[10px] hover:shadow"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          Uji Coba Suara (TTS)
        </button>
      </div>
    </div>
  );
}
