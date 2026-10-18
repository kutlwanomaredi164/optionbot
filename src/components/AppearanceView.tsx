import React, { useState } from 'react';
import { ChatbotConfig, BotAppearance } from '../types';
import { api } from '../services/api';
import { ChatPreview } from './ChatPreview';
import {
  Palette,
  Save,
  Check,
  Sparkles,
  Smartphone,
  Sliders,
} from 'lucide-react';

interface AppearanceViewProps {
  bot: ChatbotConfig;
  onUpdateBot: (updated: ChatbotConfig) => void;
}

const COLOR_PRESETS = [
  { name: 'Electric Violet', brand: '#4f46e5', accent: '#6366f1' },
  { name: 'Ocean Navy', brand: '#1e3a8a', accent: '#3b82f6' },
  { name: 'Emerald Studio', brand: '#047857', accent: '#10b981' },
  { name: 'Warm Amber', brand: '#b45309', accent: '#f59e0b' },
  { name: 'Crimson Luxe', brand: '#be123c', accent: '#f43f5e' },
  { name: 'Obsidian Slate', brand: '#0f172a', accent: '#334155' },
];

export function AppearanceView({ bot, onUpdateBot }: AppearanceViewProps) {
  const [appearance, setAppearance] = useState<BotAppearance>(bot.appearance);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const previewBot: ChatbotConfig = {
    ...bot,
    appearance,
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateBot(bot.id, { appearance });
      onUpdateBot(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save appearance', err);
      alert('Could not save appearance settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Appearance & Branding</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              {bot.name}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Customize the look, colors, greeting messages, and launcher widget position for your bot.
          </p>
        </div>

        {savedSuccess && (
          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <Check className="w-4 h-4" /> Branding saved
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: 7 cols */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-5">
          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Identity & Messaging
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bot Display Name
              </label>
              <input
                type="text"
                required
                value={appearance.botDisplayName}
                onChange={(e) => setAppearance({ ...appearance, botDisplayName: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Greeting Message
              </label>
              <textarea
                rows={2}
                required
                value={appearance.greetingMessage}
                onChange={(e) => setAppearance({ ...appearance, greetingMessage: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
              />
            </div>
          </div>

          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Brand Colors & Presets
            </h3>

            {/* Presets */}
            <div className="grid grid-cols-3 gap-2">
              {COLOR_PRESETS.map((p) => (
                <button
                  type="button"
                  key={p.name}
                  onClick={() =>
                    setAppearance({
                      ...appearance,
                      brandColor: p.brand,
                      accentColor: p.accent,
                    })
                  }
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all flex items-center gap-2 ${
                    appearance.brandColor === p.brand
                      ? 'border-indigo-600 bg-indigo-50/50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: p.brand }}
                  />
                  <span className="text-[11.5px] font-semibold text-slate-800 truncate">
                    {p.name}
                  </span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Brand Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={appearance.brandColor}
                    onChange={(e) => setAppearance({ ...appearance, brandColor: e.target.value })}
                    className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={appearance.brandColor}
                    onChange={(e) => setAppearance({ ...appearance, brandColor: e.target.value })}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Accent Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={appearance.accentColor}
                    onChange={(e) => setAppearance({ ...appearance, accentColor: e.target.value })}
                    className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={appearance.accentColor}
                    onChange={(e) => setAppearance({ ...appearance, accentColor: e.target.value })}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Widget Layout & Dimensions
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Launcher Position
                </label>
                <select
                  value={appearance.launcherPosition}
                  onChange={(e) =>
                    setAppearance({
                      ...appearance,
                      launcherPosition: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="bottom_right">Bottom Right of Page</option>
                  <option value="bottom_left">Bottom Left of Page</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Widget Dimension
                </label>
                <select
                  value={appearance.widgetSize}
                  onChange={(e) =>
                    setAppearance({
                      ...appearance,
                      widgetSize: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="standard">Standard (390 × 620px)</option>
                  <option value="compact">Compact (340 × 520px)</option>
                  <option value="expanded">Expanded (440 × 700px)</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Appearance Changes'}
          </button>
        </form>

        {/* Right Preview: 5 cols */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-2 text-xs text-slate-500 px-1">
            <span className="font-semibold text-slate-700">Real-Time Appearance Preview</span>
            <span className="font-mono text-[11px] text-slate-400">Live render</span>
          </div>

          <div className="w-full max-w-[380px] h-[600px] rounded-2xl shadow-xl ring-8 ring-slate-800 overflow-hidden">
            <ChatPreview bot={previewBot} />
          </div>
        </div>
      </div>
    </div>
  );
}
