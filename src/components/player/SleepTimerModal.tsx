import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useAudioPlayer, SleepTimerOption } from '../../context/AudioPlayerContext';
import { Moon, Timer, VolumeX, Check, AlertCircle } from 'lucide-react';

interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function formatSecondsToTimer(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m ${secs < 10 ? '0' : ''}${secs}s`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({ isOpen, onClose }) => {
  const {
    sleepTimerOption,
    sleepTimerRemaining,
    isSleepTimerActive,
    fadeOutSeconds,
    setSleepTimer,
    cancelSleepTimer
  } = useAudioPlayer();

  const [customMinutes, setCustomMinutes] = useState<number>(20);
  const [selectedFade, setSelectedFade] = useState<number>(fadeOutSeconds || 30);
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);

  const presets: { label: string; value: SleepTimerOption; desc?: string }[] = [
    { label: '15 Minutes', value: 15, desc: 'Quick Power Nap' },
    { label: '30 Minutes', value: 30, desc: 'Standard Night Rest' },
    { label: '45 Minutes', value: 45, desc: 'Deep Relaxation' },
    { label: '60 Minutes (1 Hr)', value: 60, desc: 'Long Sleep Mix' },
    { label: 'End of current song', value: 'end-of-track', desc: 'Finish playing this track' },
  ];

  const handleSelectPreset = (value: SleepTimerOption) => {
    setSleepTimer(value, selectedFade);
    onClose();
  };

  const handleApplyCustom = () => {
    if (customMinutes > 0) {
      setSleepTimer(customMinutes, selectedFade);
      onClose();
    }
  };

  const handleCancelTimer = () => {
    cancelSleepTimer();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sleep Timer & Fade-Out">
      <div className="space-y-5 select-none">
        {/* Header Icon + Description */}
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
          <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400 shrink-0">
            <Moon className="w-5 h-5" />
          </div>
          <div className="text-xs space-y-1">
            <p className="font-bold text-white">Fall asleep peacefully with zero battery drain</p>
            <p className="text-slate-300 leading-relaxed">
              Music plays normally, then in the last <strong>{selectedFade}s</strong> gently fades out to silence before pausing playback.
            </p>
          </div>
        </div>

        {/* Live Active Timer Countdown Banner */}
        {isSleepTimerActive && sleepTimerRemaining !== null && (
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/80 to-indigo-950/80 border border-purple-500/30 shadow-lg animate-fade-in">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <span className="text-xs text-purple-200 font-semibold block">Sleep Timer Active</span>
                <span className="text-base font-extrabold text-white font-mono tracking-wide">
                  {formatSecondsToTimer(sleepTimerRemaining)} remaining
                </span>
              </div>
            </div>

            <button
              onClick={handleCancelTimer}
              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold transition-colors"
            >
              Turn Off
            </button>
          </div>
        )}

        {/* Presets List */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-1">
            Choose Sleep Duration
          </label>

          <div className="grid grid-cols-1 gap-2">
            {presets.map((p) => {
              const isCurrent = sleepTimerOption === p.value;
              return (
                <button
                  key={String(p.value)}
                  onClick={() => handleSelectPreset(p.value)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                    isCurrent
                      ? 'bg-brand-500/20 border-brand-500 text-white shadow-md'
                      : 'bg-dark-card/60 hover:bg-dark-card border-dark-border/80 text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Timer className={`w-4 h-4 ${isCurrent ? 'text-brand-400' : 'text-slate-400'}`} />
                    <div>
                      <span className="text-xs font-bold block text-white">{p.label}</span>
                      {p.desc && <span className="text-[10px] text-slate-400">{p.desc}</span>}
                    </div>
                  </div>
                  {isCurrent && <Check className="w-4 h-4 text-brand-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Duration Section */}
        <div className="pt-2 border-t border-dark-border/80">
          {!showCustomInput ? (
            <button
              onClick={() => setShowCustomInput(true)}
              className="text-xs font-semibold text-brand-400 hover:underline flex items-center gap-1.5"
            >
              <span>Set custom minutes (e.g. 25 min, 90 min)...</span>
            </button>
          ) : (
            <div className="space-y-3 p-3.5 rounded-2xl bg-dark-card/40 border border-dark-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">Custom Duration</span>
                <span className="text-xs font-mono font-bold text-brand-400">{customMinutes} minutes</span>
              </div>
              <input
                type="range"
                min="5"
                max="180"
                step="5"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>5 min</span>
                <span>60 min (1h)</span>
                <span>180 min (3h)</span>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowCustomInput(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyCustom}
                  className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-600/30"
                >
                  Start {customMinutes}m Timer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Fade-Out Setting */}
        <div className="p-3.5 rounded-2xl bg-dark-card/40 border border-dark-border space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <VolumeX className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-slate-200">Smooth Fade-Out Duration</span>
            </div>
            <span className="text-xs text-indigo-300 font-mono font-semibold">{selectedFade}s</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[15, 30, 45, 60].map((dur) => (
              <button
                key={dur}
                onClick={() => setSelectedFade(dur)}
                className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedFade === dur
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                {dur}s
              </button>
            ))}
          </div>
        </div>

        {/* Actions Bottom */}
        {isSleepTimerActive && (
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleCancelTimer}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition-all"
            >
              Turn Off Sleep Timer
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
