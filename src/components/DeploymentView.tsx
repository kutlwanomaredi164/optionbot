import React, { useState } from 'react';
import { ChatbotConfig } from '../types';
import { api } from '../services/api';
import {
  Code,
  Copy,
  Check,
  Globe,
  ExternalLink,
  MessageCircle,
  ShieldAlert,
  Power,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface DeploymentViewProps {
  bot: ChatbotConfig;
  onUpdateBot: (updated: ChatbotConfig) => void;
}

export function DeploymentView({ bot, onUpdateBot }: DeploymentViewProps) {
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [testingEndpoint, setTestingEndpoint] = useState(false);
  const [endpointResult, setEndpointResult] = useState<any>(null);

  // WhatsApp setup state
  const [waPhoneId, setWaPhoneId] = useState(bot.deployment.whatsappConfig?.phoneNumberId || '');
  const [waAccountId, setWaAccountId] = useState(bot.deployment.whatsappConfig?.businessAccountId || '');
  const [savingWa, setSavingWa] = useState(false);
  const [waSuccess, setWaSuccess] = useState(false);

  const embedScript = `<script src="${window.location.origin}/widget.js" data-bot-id="${bot.deployment.deploymentId}" async></script>`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(embedScript);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2500);
  };

  const handleToggleDeployment = async () => {
    setUpdating(true);
    try {
      const updated = await api.updateBot(bot.id, {
        deployment: {
          ...bot.deployment,
          isEnabled: !bot.deployment.isEnabled,
        },
      });
      onUpdateBot(updated);
    } catch (err) {
      console.error('Failed to toggle deployment', err);
      alert('Could not update deployment status');
    } finally {
      setUpdating(false);
    }
  };

  const handleTestPublicEndpoint = async () => {
    setTestingEndpoint(true);
    setEndpointResult(null);
    try {
      const data = await api.getPublicBot(bot.deployment.deploymentId);
      setEndpointResult({ success: true, data });
    } catch (err: any) {
      setEndpointResult({ success: false, error: err.message || 'Endpoint rejected request' });
    } finally {
      setTestingEndpoint(false);
    }
  };

  const handleSaveWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWa(true);
    try {
      const isConnected = Boolean(waPhoneId.trim() && waAccountId.trim());
      const updated = await api.updateBot(bot.id, {
        deployment: {
          ...bot.deployment,
          whatsappConfig: {
            ...bot.deployment.whatsappConfig,
            phoneNumberId: waPhoneId.trim(),
            businessAccountId: waAccountId.trim(),
            isConnected,
            status: isConnected ? 'connected' : 'disconnected',
            verifyToken: 'SELECTBOT_WHATSAPP_TOKEN',
            webhookUrl: `${window.location.origin}/api/integrations/whatsapp/webhook`,
          },
        },
      });
      onUpdateBot(updated);
      setWaSuccess(true);
      setTimeout(() => setWaSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save WhatsApp config', err);
    } finally {
      setSavingWa(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Deployment & Embed Channels</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              {bot.name}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Deploy your chatbot to websites via JavaScript embed script or connect to WhatsApp Business.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              bot.deployment.isEnabled && bot.status === 'published'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            {bot.deployment.isEnabled && bot.status === 'published'
              ? '● Deployment Active'
              : '○ Deployment Inactive'}
          </span>
        </div>
      </div>

      {/* Website Widget Deployment Card */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Website Floating Widget</h3>
              <p className="text-xs text-slate-500">
                Embed a fast, responsive chat launcher on any HTML, WordPress, Webflow, or Shopify website.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleDeployment}
              disabled={updating}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                bot.deployment.isEnabled
                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              {bot.deployment.isEnabled ? 'Disable Deployment' : 'Enable Deployment'}
            </button>
          </div>
        </div>

        {/* Status warning if draft */}
        {bot.status !== 'published' && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              This bot is currently in <strong>Draft Mode</strong>. Remember to click "Publish Bot" in the Conversation Builder before visitors can access it publicly.
            </span>
          </div>
        )}

        {/* Public Deployment ID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Public Deployment Identifier
            </span>
            <span className="font-mono text-slate-900 font-bold text-xs mt-1 block">
              {bot.deployment.deploymentId}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Widget Engine Endpoint
            </span>
            <span className="font-mono text-slate-700 text-xs mt-1 block truncate">
              {window.location.origin}/widget.js
            </span>
          </div>
        </div>

        {/* Generated Embed Snippet */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              HTML Embed Code
            </label>
            <button
              onClick={handleCopyCode}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              {copiedSnippet ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Code
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <pre className="p-3.5 bg-slate-900 text-indigo-200 text-xs font-mono rounded-lg overflow-x-auto leading-relaxed">
              {embedScript}
            </pre>
          </div>

          <p className="text-[11.5px] text-slate-500">
            Paste this snippet immediately before the closing <code className="text-slate-800 font-mono">&lt;/body&gt;</code> tag on your website pages.
          </p>
        </div>

        {/* Verification Tester */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handleTestPublicEndpoint}
            disabled={testingEndpoint}
            className="px-3.5 py-1.5 bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingEndpoint ? 'animate-spin' : ''}`} />
            {testingEndpoint ? 'Testing...' : 'Verify Public Endpoint Status'}
          </button>

          <a
            href={`/?embed=true&deploymentId=${encodeURIComponent(bot.deployment.deploymentId)}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
          >
            <span>Open Standalone Widget View</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {endpointResult && (
          <div
            className={`p-3 rounded-lg border text-xs ${
              endpointResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {endpointResult.success ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  Public API verified! Bot "{endpointResult.data.businessName}" responded with {endpointResult.data.mainMenuItems.length} live categories.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Verification check failed: {endpointResult.error}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* WhatsApp Business Platform Integration Card */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">WhatsApp Business Platform</h3>
                <span
                  className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${
                    bot.deployment.whatsappConfig?.isConnected
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {bot.deployment.whatsappConfig?.isConnected ? 'Connected' : 'Setup Required'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Official Meta Cloud API integration for automated WhatsApp customer messaging.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveWhatsApp} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                WhatsApp Phone Number ID
              </label>
              <input
                type="text"
                placeholder="e.g. 10482910492810"
                value={waPhoneId}
                onChange={(e) => setWaPhoneId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                WhatsApp Business Account ID (WABA)
              </label>
              <input
                type="text"
                placeholder="e.g. 29482019482019"
                value={waAccountId}
                onChange={(e) => setWaAccountId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
              Meta Webhook Configuration Details
            </span>
            <div className="grid grid-cols-2 gap-3 text-slate-600">
              <div>
                <span className="font-medium text-slate-500 block">Callback URL:</span>
                <span className="font-mono text-[11px] text-slate-800">
                  {window.location.origin}/api/integrations/whatsapp/webhook
                </span>
              </div>
              <div>
                <span className="font-medium text-slate-500 block">Verify Token:</span>
                <span className="font-mono text-[11px] text-slate-800">
                  SELECTBOT_WHATSAPP_TOKEN
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-[11px] text-slate-500">
              Requires a verified Meta for Developers app with WhatsApp product enabled.
            </div>
            <button
              type="submit"
              disabled={savingWa}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {savingWa ? 'Saving...' : 'Save WhatsApp Configuration'}
            </button>
          </div>
        </form>

        {waSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp configuration credentials saved successfully.</span>
          </div>
        )}
      </div>
    </div>
  );
}
