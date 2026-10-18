import React, { useState } from 'react';
import { STARTER_TEMPLATES } from '../data/templates';
import { api } from '../services/api';
import { ChatbotConfig, ConversationStyle } from '../types';
import {
  X,
  Camera,
  Utensils,
  Car,
  Scissors,
  Briefcase,
  Layers,
  ArrowRight,
  ArrowLeft,
  Check,
  Building,
  Sparkles,
  HelpCircle,
  Cpu,
  Compass,
} from 'lucide-react';

interface CreateBotModalProps {
  isOpen: boolean;
  workspaceId: string;
  onClose: () => void;
  onBotCreated: (bot: ChatbotConfig) => void;
}

const INDUSTRIES = [
  'Photography Studio',
  'Restaurant & Hospitality',
  'Automotive Dealership',
  'Beauty & Wellness',
  'Clothing & Retail',
  'Dentists & Healthcare',
  'Property & Real Estate',
  'Professional Services',
  'E-commerce Store',
  'Other / Custom Industry',
];

export function CreateBotModal({ isOpen, workspaceId, onClose, onBotCreated }: CreateBotModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [botName, setBotName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('Photography Studio');
  const [customIndustry, setCustomIndustry] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Step 2 Template
  const [selectedTemplateId, setSelectedTemplateId] = useState('photography');

  // Step 3 Conversation Style
  const [conversationStyle, setConversationStyle] = useState<ConversationStyle>('hybrid');

  if (!isOpen) return null;

  const handleNextFromStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!botName.trim() || !businessName.trim()) {
      setError('Please provide both a chatbot name and your business name.');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);

    const resolvedIndustry =
      industry === 'Other / Custom Industry' && customIndustry.trim()
        ? customIndustry.trim()
        : industry;

    try {
      const created = await api.createBot({
        workspaceId,
        name: botName.trim(),
        businessName: businessName.trim(),
        industry: resolvedIndustry,
        description: description.trim(),
        website: website.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        templateId: selectedTemplateId,
        conversationStyle,
      });

      onBotCreated(created);
      onClose();
    } catch (err: any) {
      console.error('Failed to create bot', err);
      setError(err.message || 'Failed to create chatbot. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderTemplateIcon = (icon: string) => {
    switch (icon) {
      case 'camera':
        return <Camera className="w-5 h-5 text-indigo-600" />;
      case 'utensils':
        return <Utensils className="w-5 h-5 text-teal-600" />;
      case 'car':
        return <Car className="w-5 h-5 text-blue-600" />;
      case 'scissors':
        return <Scissors className="w-5 h-5 text-rose-600" />;
      default:
        return <Briefcase className="w-5 h-5 text-indigo-600" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900">Create a New Chatbot</h3>
            <p className="text-xs text-slate-500">Step {step} of 3 — Guided creation flow</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps Indicator */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600 shrink-0">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-600' : 'text-slate-400'}`}>
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              1
            </span>
            <span>Business Details</span>
          </div>

          <div className="w-12 h-px bg-slate-200" />

          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-600' : 'text-slate-400'}`}>
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              2
            </span>
            <span>Starter Template</span>
          </div>

          <div className="w-12 h-px bg-slate-200" />

          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-indigo-600' : 'text-slate-400'}`}>
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                step >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              3
            </span>
            <span>Conversation Style</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* STEP 1: BUSINESS DETAILS */}
          {step === 1 && (
            <form id="step1-form" onSubmit={handleNextFromStep1} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chatbot Internal Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Studio Concierge Bot"
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer-Facing Business Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lens & Light Photography"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Business Industry
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>

              {industry === 'Other / Custom Industry' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Custom Industry Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sustainable Solar Roofing & Storage"
                    value={customIndustry}
                    onChange={(e) => setCustomIndustry(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Short Business Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Award-winning documentary wedding and portrait studio based in London."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Website (optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    placeholder="hello@business.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 012-3456"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </form>
          )}

          {/* STEP 2: CHOOSE STARTER TEMPLATE */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Choose a starter template for your industry. Templates create fully customizable
                starter configurations, not locked runtime rules.
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                {STARTER_TEMPLATES.map((tpl) => {
                  const isSelected = tpl.id === selectedTemplateId;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => setSelectedTemplateId(tpl.id)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3.5 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-white border border-slate-200 shrink-0">
                        {renderTemplateIcon(tpl.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900">{tpl.name}</h4>
                          {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{tpl.description}</p>
                        <div className="flex items-center gap-2 mt-2 text-[10.5px] text-slate-400 font-mono">
                          <span>{tpl.defaultMenuItems.length} Default Categories</span>
                          <span>·</span>
                          <span>Pre-loaded Knowledge</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: CONVERSATION STYLE */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Select how customers will navigate your chatbot. In Hybrid mode, menu navigation is
                instantaneous, while questions typed by customers are answered using AI grounded in
                your knowledge base.
              </p>

              <div className="grid grid-cols-1 gap-3">
                <div
                  onClick={() => setConversationStyle('hybrid')}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3.5 ${
                    conversationStyle === 'hybrid'
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-white border border-slate-200 text-indigo-600 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">
                        Hybrid Mode (Recommended)
                      </h4>
                      {conversationStyle === 'hybrid' && (
                        <Check className="w-4 h-4 text-indigo-600" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Combines clear, deterministic menu buttons with Gemini natural language
                      understanding when customers type free-form questions.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => setConversationStyle('guided')}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3.5 ${
                    conversationStyle === 'guided'
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-white border border-slate-200 text-teal-600 shrink-0">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">Guided Menus Only</h4>
                      {conversationStyle === 'guided' && (
                        <Check className="w-4 h-4 text-indigo-600" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Strict menu-driven flow. Customers navigate step-by-step through categories and
                      options without free-text AI generation.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => setConversationStyle('ai')}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3.5 ${
                    conversationStyle === 'ai'
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-white border border-slate-200 text-purple-600 shrink-0">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">AI-Assisted Chat</h4>
                      {conversationStyle === 'ai' && <Check className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Emphasizes natural language conversation, citing verified services and
                      knowledge base documents.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              Cancel
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1) {
                    if (!botName.trim() || !businessName.trim()) {
                      setError('Please enter a chatbot name and business name.');
                      return;
                    }
                    setError(null);
                    setStep(2);
                  } else if (step === 2) {
                    setStep(3);
                  }
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                Continue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCreate}
                disabled={loading}
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {loading ? 'Creating Bot...' : 'Create Chatbot & Open Builder'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
