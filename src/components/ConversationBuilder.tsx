import React, { useState } from 'react';
import {
  ChatbotConfig,
  MainMenuItem,
  SubtopicItem,
  ContentType,
  PricingMethod,
  ActionField,
} from '../types';
import { api } from '../services/api';
import { formatCurrency } from '../utils/currency';
import { ChatPreview } from './ChatPreview';
import {
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Save,
  Globe,
  Smartphone,
  Monitor,
  Check,
  AlertCircle,
  HelpCircle,
  Camera,
  Utensils,
  Car,
  Scissors,
  Briefcase,
  FileText,
  Truck,
  Image as ImageIcon,
  User,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Code,
  Layers,
  Sparkles,
  Link as LinkIcon,
  ListPlus,
  Share2,
} from 'lucide-react';

interface ConversationBuilderProps {
  bot: ChatbotConfig;
  onUpdateBot: (updated: ChatbotConfig) => void;
  onRefreshAll: () => void;
}

const AVAILABLE_ICONS = [
  { id: 'camera', label: 'Camera / Photo', icon: Camera },
  { id: 'utensils', label: 'Dining / Food', icon: Utensils },
  { id: 'car', label: 'Automotive / Car', icon: Car },
  { id: 'scissors', label: 'Salon / Cuts', icon: Scissors },
  { id: 'briefcase', label: 'Services / B2B', icon: Briefcase },
  { id: 'file-text', label: 'Policy / Docs', icon: FileText },
  { id: 'truck', label: 'Delivery / Freight', icon: Truck },
  { id: 'image', label: 'Gallery / Media', icon: ImageIcon },
  { id: 'user', label: 'Human / Person', icon: User },
];

export function ConversationBuilder({ bot, onUpdateBot, onRefreshAll }: ConversationBuilderProps) {
  const [activeMenuId, setActiveMenuId] = useState<string>(
    bot.mainMenuItems[0]?.id || ''
  );
  const [activeSubtopicId, setActiveSubtopicId] = useState<string>('');
  const [devicePreview, setDevicePreview] = useState<'mobile' | 'desktop'>('mobile');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPublishingControls, setShowPublishingControls] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [previewSyncKey, setPreviewSyncKey] = useState(0);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    type: 'menu' | 'subtopic';
    id: string;
    title: string;
  } | null>(null);

  // Local copy of bot configuration for editing
  const [currentBot, setCurrentBot] = useState<ChatbotConfig>(bot);

  const activeMenu = currentBot.mainMenuItems.find((m) => m.id === activeMenuId);
  const activeSubtopic = activeMenu?.subtopics.find((s) => s.id === activeSubtopicId);

  // Update current bot in state
  const updateCurrentBot = (newConfig: ChatbotConfig) => {
    setCurrentBot(newConfig);
    setIsDirty(true);
    setSaveSuccess(false);
  };

  // Sync / Refresh preview frame
  const handleSyncPreview = () => {
    setPreviewSyncKey((prev) => prev + 1);
  };

  // Copy embed snippet
  const handleCopyEmbed = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2500);
  };

  // Save changes to backend
  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await api.updateBot(currentBot.id, {
        mainMenuItems: currentBot.mainMenuItems,
        name: currentBot.name,
        businessName: currentBot.businessName,
        industry: currentBot.industry,
        currency: currentBot.currency || 'ZAR',
      });
      setCurrentBot(updated);
      onUpdateBot(updated);
      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save bot', err);
      alert('Could not save changes to bot.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle publish status
  const handleTogglePublish = async () => {
    try {
      setPublishing(true);
      const res = await api.togglePublish(currentBot.id);
      setCurrentBot(res.bot);
      onUpdateBot(res.bot);
      onRefreshAll();
    } catch (err) {
      console.error('Failed to toggle publish', err);
      alert('Could not update publish status');
    } finally {
      setPublishing(false);
    }
  };

  // --- Main Menu Operations ---
  const handleAddMainMenu = () => {
    const newId = `menu_${Date.now()}`;
    const nextOrder = currentBot.mainMenuItems.length + 1;
    const newItem: MainMenuItem = {
      id: newId,
      title: `Main Topic ${nextOrder}`,
      description: 'Describe this topic for visitors',
      introductoryMessage: `Welcome to Main Topic ${nextOrder}! Please choose an option below:`,
      icon: 'briefcase',
      isHidden: false,
      order: nextOrder,
      subtopics: [
        {
          id: `sub_${Date.now()}_1`,
          title: 'Overview & Details',
          description: 'Explore details and offerings',
          order: 1,
          contentType: 'information',
          content: {
            information: {
              title: 'Overview & Details',
              shortDescription: 'Clear summary of what is offered.',
              detailedContent: 'Comprehensive details to help visitors understand the options available under this main topic.',
            },
          },
        },
      ],
    };
    const updatedMenus = [...currentBot.mainMenuItems, newItem];
    updateCurrentBot({ ...currentBot, mainMenuItems: updatedMenus });
    setActiveMenuId(newId);
    setActiveSubtopicId(`sub_${Date.now()}_1`);
  };

  const handleUpdateMainMenu = (menuId: string, updates: Partial<MainMenuItem>) => {
    const updatedMenus = currentBot.mainMenuItems.map((m) =>
      m.id === menuId ? { ...m, ...updates } : m
    );
    updateCurrentBot({ ...currentBot, mainMenuItems: updatedMenus });
  };

  const handleMoveMenu = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= currentBot.mainMenuItems.length) return;

    const list = [...currentBot.mainMenuItems];
    const [moved] = list.splice(index, 1);
    list.splice(newIndex, 0, moved);

    // reindex order
    const reordered = list.map((item, idx) => ({ ...item, order: idx + 1 }));
    updateCurrentBot({ ...currentBot, mainMenuItems: reordered });
  };

  const handleDuplicateMenu = (menuId: string) => {
    const target = currentBot.mainMenuItems.find((m) => m.id === menuId);
    if (!target) return;

    const copyId = `menu_${Date.now()}`;
    const duplicate: MainMenuItem = {
      ...JSON.parse(JSON.stringify(target)),
      id: copyId,
      title: `${target.title} (Copy)`,
      order: currentBot.mainMenuItems.length + 1,
      subtopics: target.subtopics.map((s, idx) => ({
        ...s,
        id: `sub_${Date.now()}_${idx}`,
      })),
    };

    const updated = [...currentBot.mainMenuItems, duplicate];
    updateCurrentBot({ ...currentBot, mainMenuItems: updated });
    setActiveMenuId(copyId);
    setActiveSubtopicId('');
  };

  const handleDeleteMenuConfirm = () => {
    if (!deleteConfirmModal || deleteConfirmModal.type !== 'menu') return;
    const filtered = currentBot.mainMenuItems.filter((m) => m.id !== deleteConfirmModal.id);
    updateCurrentBot({ ...currentBot, mainMenuItems: filtered });
    setActiveMenuId(filtered[0]?.id || '');
    setActiveSubtopicId('');
    setDeleteConfirmModal(null);
  };

  // --- Subtopic Operations ---
  const handleAddSubtopic = (contentType: ContentType = 'information') => {
    if (!activeMenu) return;
    const newSubId = `sub_${Date.now()}`;
    const newSub: SubtopicItem = {
      id: newSubId,
      title: 'New Subtopic Item',
      description: 'Brief overview for this topic',
      order: activeMenu.subtopics.length + 1,
      contentType,
      content: getInitialSubtopicContent(contentType),
    };

    const updatedMenus = currentBot.mainMenuItems.map((m) => {
      if (m.id === activeMenu.id) {
        return { ...m, subtopics: [...m.subtopics, newSub] };
      }
      return m;
    });

    updateCurrentBot({ ...currentBot, mainMenuItems: updatedMenus });
    setActiveSubtopicId(newSubId);
  };

  const handleUpdateSubtopic = (subId: string, updates: Partial<SubtopicItem>) => {
    if (!activeMenu) return;
    const updatedSubtopics = activeMenu.subtopics.map((s) => {
      if (s.id === subId) {
        return { ...s, ...updates };
      }
      return s;
    });

    const updatedMenus = currentBot.mainMenuItems.map((m) => {
      if (m.id === activeMenu.id) {
        return { ...m, subtopics: updatedSubtopics };
      }
      return m;
    });

    updateCurrentBot({ ...currentBot, mainMenuItems: updatedMenus });
  };

  const handleUpdateSubtopicContent = (subId: string, contentUpdates: any) => {
    if (!activeMenu) return;
    const sub = activeMenu.subtopics.find((s) => s.id === subId);
    if (!sub) return;

    const newContent = {
      ...sub.content,
      ...contentUpdates,
    };

    handleUpdateSubtopic(subId, { content: newContent });
  };

  const handleDeleteSubtopicConfirm = () => {
    if (!deleteConfirmModal || deleteConfirmModal.type !== 'subtopic' || !activeMenu) return;
    const filtered = activeMenu.subtopics.filter((s) => s.id !== deleteConfirmModal.id);
    const updatedMenus = currentBot.mainMenuItems.map((m) => {
      if (m.id === activeMenu.id) {
        return { ...m, subtopics: filtered };
      }
      return m;
    });

    updateCurrentBot({ ...currentBot, mainMenuItems: updatedMenus });
    setActiveSubtopicId(filtered[0]?.id || '');
    setDeleteConfirmModal(null);
  };

  function getInitialSubtopicContent(type: ContentType) {
    switch (type) {
      case 'service_product':
        return {
          serviceProduct: {
            name: 'Service Offering Name',
            description: 'Clear description of the service and customer benefits.',
            price: 'R 250.00',
            pricingMethod: 'starting_at' as PricingMethod,
            duration: '60 minutes',
            inclusions: ['Initial consultation', 'Full delivery package'],
            exclusions: ['Travel outside zone'],
            actionLabel: 'Book This Service',
          },
        };
      case 'faq':
        return {
          faq: {
            question: 'Common customer question?',
            approvedAnswer: 'Verified answer that will be delivered by the chatbot.',
          },
        };
      case 'gallery':
        return {
          gallery: {
            galleryName: 'Portfolio Gallery',
            images: [
              {
                url: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=800&q=80',
                caption: 'Sample work photo',
              },
            ],
          },
        };
      case 'policy':
        return {
          policy: {
            policyTitle: 'Terms & Conditions',
            policyText: 'State your cancellation policy, booking terms, or privacy notice.',
            effectiveDate: new Date().toISOString().split('T')[0],
          },
        };
      case 'external_link':
        return {
          externalLink: {
            linkLabel: 'Visit External Resource',
            destinationUrl: 'https://example.com',
            description: 'Link description',
            openInNewTab: true,
          },
        };
      case 'action':
        return {
          action: {
            actionId: `act_${Date.now()}`,
            actionType: 'booking' as any,
            title: 'Booking Request',
            description: 'Fill in your details to reserve your spot.',
            fields: [
              { id: 'f_name', label: 'Your Name', type: 'text', required: true },
              { id: 'f_phone', label: 'Phone Number', type: 'phone', required: true },
              { id: 'f_date', label: 'Preferred Date', type: 'date', required: true },
            ] as ActionField[],
            submitButtonText: 'Submit Booking',
            successMessage: 'Your request has been received!',
          },
        };
      case 'human_assistance':
        return {
          humanAssistance: {
            introductoryMessage: 'Leave a note for our team below.',
            customerMessagePlaceholder: 'How can we assist you?',
            requireContactDetails: true,
            contactFields: ['name', 'email', 'phone'] as any,
            handoffDestination: 'dashboard_inbox' as any,
            confirmationBehavior: 'A staff member will reach out shortly.',
          },
        };
      default:
        return {
          information: {
            title: 'Information Title',
            shortDescription: 'Brief summary of this topic',
            detailedContent: 'Comprehensive details that explain the service or business information.',
          },
        };
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-100">
      {/* Builder Sub-Header Toolbar */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                Conversation Builder
              </h2>
              <span
                className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${
                  currentBot.status === 'published'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {currentBot.status === 'published' ? '● Live / Published' : '○ Draft Mode'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {currentBot.businessName} · {currentBot.industry} · Currency: {currentBot.currency || 'ZAR (R)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDirty && (
            <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Unsaved changes
            </span>
          )}

          {saveSuccess && (
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Changes saved
            </span>
          )}

          {/* Collapsible Publishing Controls Toggle Button */}
          <button
            onClick={() => setShowPublishingControls(!showPublishingControls)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
              showPublishingControls
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
            title="Toggle publishing and embedding controls"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-600" />
            <span>Publishing Controls</span>
            {showPublishingControls ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
              isDirty
                ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : isDirty ? 'Save Changes' : 'Save Draft'}
          </button>

          <button
            onClick={handleTogglePublish}
            disabled={publishing}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
              currentBot.status === 'published'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            {publishing
              ? 'Updating...'
              : currentBot.status === 'published'
              ? 'Unpublish'
              : 'Publish Bot'}
          </button>

          <div className="h-4 w-px bg-slate-200 mx-0.5" />

          {/* Device Preview Toggle */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => setDevicePreview('mobile')}
              className={`p-1 rounded cursor-pointer ${
                devicePreview === 'mobile' ? 'bg-white shadow-xs text-indigo-600' : 'text-slate-500'
              }`}
              title="Mobile frame"
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDevicePreview('desktop')}
              className={`p-1 rounded cursor-pointer ${
                devicePreview === 'desktop' ? 'bg-white shadow-xs text-indigo-600' : 'text-slate-500'
              }`}
              title="Desktop card"
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible Publishing Controls Drawer */}
      {showPublishingControls && (
        <div className="bg-slate-900 text-white border-b border-slate-800 px-6 py-3.5 transition-all animate-in fade-in slide-in-from-top-1">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Publishing & Deployment Controls
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.2 rounded-full ${
                    currentBot.status === 'published'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {currentBot.status === 'published' ? 'Active & Live' : 'Unpublished Draft'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Deploy this bot to your website using the JavaScript embed snippet, or test it directly.
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2.5">
              <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-mono text-slate-300">
                <Code className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate max-w-[260px]">
                  &lt;script src="/widget.js" data-bot-id="{currentBot.deployment?.deploymentId}" async&gt;&lt;/script&gt;
                </span>
                <button
                  onClick={() =>
                    handleCopyEmbed(
                      `<script src="${window.location.origin}/widget.js" data-bot-id="${currentBot.deployment?.deploymentId}" async></script>`
                    )
                  }
                  className="ml-1 text-xs text-indigo-400 hover:text-indigo-300 font-sans font-medium flex items-center gap-1 cursor-pointer"
                  title="Copy embed code"
                >
                  {copiedEmbed ? (
                    <span className="text-emerald-400 flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Copied
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5">
                      <Copy className="w-3 h-3" /> Copy
                    </span>
                  )}
                </button>
              </div>

              <a
                href={`/?embed=true&deploymentId=${currentBot.deployment?.deploymentId}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <span>Open Test Page</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <button
                onClick={() => setShowPublishingControls(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded cursor-pointer"
              >
                Hide ▲
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Builder 3-Column Split Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Column 1: Main Menu Options List (Width: 280px) */}
        <div className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Main Topics ({currentBot.mainMenuItems.length})
            </div>
            <button
              onClick={handleAddMainMenu}
              className="px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
              title="Create a new top-level main topic"
            >
              <Plus className="w-3.5 h-3.5" /> + Add Main Topic
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {currentBot.mainMenuItems.map((menu, idx) => {
              const isActive = menu.id === activeMenuId;
              return (
                <div
                  key={menu.id}
                  onClick={() => {
                    setActiveMenuId(menu.id);
                    setActiveSubtopicId(menu.subtopics[0]?.id || '');
                  }}
                  className={`group relative p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                    isActive
                      ? 'bg-indigo-50/70 border-indigo-400 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[11px] font-mono text-slate-400">0{idx + 1}.</span>
                      <span
                        className={`text-xs font-semibold truncate ${
                          isActive ? 'text-indigo-950' : 'text-slate-800'
                        }`}
                      >
                        {menu.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveMenu(idx, 'up');
                        }}
                        disabled={idx === 0}
                        title="Move Up"
                        className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveMenu(idx, 'down');
                        }}
                        disabled={idx === currentBot.mainMenuItems.length - 1}
                        title="Move Down"
                        className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateMenu(menu.id);
                        }}
                        title="Duplicate"
                        className="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmModal({
                            type: 'menu',
                            id: menu.id,
                            title: menu.title,
                          });
                        }}
                        title="Delete"
                        className="p-0.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span className="truncate max-w-[150px]">{menu.description || 'No description'}</span>
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">
                      {menu.subtopics.length} items
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Bottom Add Main Topic Button */}
            <div className="pt-2 pb-1">
              <button
                onClick={handleAddMainMenu}
                className="w-full py-2.5 px-3 border border-dashed border-indigo-300 hover:border-indigo-500 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50/40 hover:bg-indigo-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>+ Add Main Topic</span>
              </button>
            </div>
          </div>
        </div>

        {/* Column 2: Selected Main Topic & Subtopic Editor (Width: 380px) */}
        <div className="w-96 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto">
          {activeMenu ? (
            <div className="p-4 space-y-5">
              {/* Main Topic Configuration Box */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    Main Topic Configuration
                  </h3>
                  <button
                    onClick={() =>
                      handleUpdateMainMenu(activeMenu.id, { isHidden: !activeMenu.isHidden })
                    }
                    className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    {activeMenu.isHidden ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-amber-500" /> Hidden
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-600" /> Visible in Menu
                      </>
                    )}
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Topic Name / Title
                  </label>
                  <input
                    type="text"
                    value={activeMenu.title}
                    placeholder="e.g. Services & Prices, Bookings, Gallery..."
                    onChange={(e) =>
                      handleUpdateMainMenu(activeMenu.id, { title: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-white rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Description / Subtitle
                  </label>
                  <input
                    type="text"
                    value={activeMenu.description}
                    placeholder="e.g. Explore our portrait and wedding packages"
                    onChange={(e) =>
                      handleUpdateMainMenu(activeMenu.id, { description: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-white rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Topic Introduction Message</span>
                    <span className="text-[10px] text-slate-400 font-normal">Delivered in chat</span>
                  </label>
                  <textarea
                    rows={2}
                    value={activeMenu.introductoryMessage || ''}
                    placeholder={`e.g. Here are our options for ${activeMenu.title}. Please choose one to view details:`}
                    onChange={(e) =>
                      handleUpdateMainMenu(activeMenu.id, { introductoryMessage: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-white rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Delivered by the assistant when a customer selects this main topic.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Menu Icon
                  </label>
                  <select
                    value={activeMenu.icon}
                    onChange={(e) =>
                      handleUpdateMainMenu(activeMenu.id, { icon: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-white rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {AVAILABLE_ICONS.map((ico) => (
                      <option key={ico.id} value={ico.id}>
                        {ico.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subtopics Hierarchical List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Nested Subtopics ({activeMenu.subtopics.length})
                  </h4>
                  <div className="relative group">
                    <button
                      onClick={() => handleAddSubtopic('service_product')}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Subtopic
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {activeMenu.subtopics.map((sub, sIdx) => {
                    const isSubActive = sub.id === activeSubtopicId;
                    return (
                      <div
                        key={sub.id}
                        onClick={() => setActiveSubtopicId(sub.id)}
                        className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between ${
                          isSubActive
                            ? 'bg-indigo-50 border-indigo-400 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-400">
                              {sIdx + 1}.
                            </span>
                            <span
                              className={`text-xs font-semibold truncate ${
                                isSubActive ? 'text-indigo-900' : 'text-slate-800'
                              }`}
                            >
                              {sub.title}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {sub.contentType.replace('_', ' ')}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmModal({
                                type: 'subtopic',
                                id: sub.id,
                                title: sub.title,
                              });
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Delete Subtopic"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <ChevronRight
                            className={`w-4 h-4 ${
                              isSubActive ? 'text-indigo-600' : 'text-slate-400'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {activeMenu.subtopics.length === 0 && (
                    <div className="p-4 rounded-lg border border-dashed border-slate-200 text-center text-xs text-slate-500">
                      No subtopics yet. Click "+ Add Subtopic" above to configure content for this category.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-500">
              Select a main menu option to view its subtopics.
            </div>
          )}
        </div>

        {/* Column 3: Detailed Content Editor (Flex-1) */}
        <div className="flex-1 bg-white border-r border-slate-200 flex flex-col overflow-y-auto">
          {activeSubtopic ? (
            <div className="p-5 space-y-4 max-w-2xl">
              <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Content Editor — {activeSubtopic.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Category: {activeMenu?.title}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-600">Content Type:</label>
                  <select
                    value={activeSubtopic.contentType}
                    onChange={(e) => {
                      const newType = e.target.value as ContentType;
                      handleUpdateSubtopic(activeSubtopic.id, {
                        contentType: newType,
                        content: getInitialSubtopicContent(newType),
                      });
                    }}
                    className="px-2.5 py-1 text-xs rounded border border-slate-300 bg-white font-medium text-slate-800"
                  >
                    <option value="information">Information</option>
                    <option value="service_product">Service / Product</option>
                    <option value="faq">FAQ</option>
                    <option value="gallery">Gallery</option>
                    <option value="policy">Policy</option>
                    <option value="external_link">External Link</option>
                    <option value="action">Action / Workflow</option>
                    <option value="human_assistance">Human Assistance</option>
                  </select>
                </div>
              </div>

              {/* General Subtopic Title & Description */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subtopic Title
                  </label>
                  <input
                    type="text"
                    value={activeSubtopic.title}
                    onChange={(e) =>
                      handleUpdateSubtopic(activeSubtopic.id, { title: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Short Subtitle
                  </label>
                  <input
                    type="text"
                    value={activeSubtopic.description || ''}
                    onChange={(e) =>
                      handleUpdateSubtopic(activeSubtopic.id, { description: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Dynamic Content Fields Based on Type */}

              {/* TYPE: SERVICE / PRODUCT */}
              {activeSubtopic.contentType === 'service_product' && (
                <div className="p-4 bg-slate-50/70 rounded-lg border border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Service / Product Details
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Service Name
                      </label>
                      <input
                        type="text"
                        value={activeSubtopic.content.serviceProduct?.name || ''}
                        onChange={(e) =>
                          handleUpdateSubtopicContent(activeSubtopic.id, {
                            serviceProduct: {
                              ...activeSubtopic.content.serviceProduct,
                              name: e.target.value,
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white rounded border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Price (South African Rand — ZAR)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. R 250.00 or R 1,250.00"
                        value={activeSubtopic.content.serviceProduct?.price || ''}
                        onChange={(e) =>
                          handleUpdateSubtopicContent(activeSubtopic.id, {
                            serviceProduct: {
                              ...activeSubtopic.content.serviceProduct,
                              price: e.target.value,
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white rounded border border-slate-300 font-medium"
                      />
                      <div className="mt-1 text-[10.5px] text-slate-500 flex items-center justify-between">
                        <span>Chat display:</span>
                        <span className="font-semibold text-indigo-700 font-mono">
                          {formatCurrency(activeSubtopic.content.serviceProduct?.price || '0')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Pricing Method
                      </label>
                      <select
                        value={activeSubtopic.content.serviceProduct?.pricingMethod || 'starting_at'}
                        onChange={(e) =>
                          handleUpdateSubtopicContent(activeSubtopic.id, {
                            serviceProduct: {
                              ...activeSubtopic.content.serviceProduct,
                              pricingMethod: e.target.value as PricingMethod,
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white rounded border border-slate-300"
                      >
                        <option value="fixed">Fixed Price</option>
                        <option value="starting_at">Starting At</option>
                        <option value="hourly">Hourly Rate</option>
                        <option value="custom_quote">Custom Quote</option>
                        <option value="free">Free / Included</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Duration (optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 60 minutes or 8 hours"
                        value={activeSubtopic.content.serviceProduct?.duration || ''}
                        onChange={(e) =>
                          handleUpdateSubtopicContent(activeSubtopic.id, {
                            serviceProduct: {
                              ...activeSubtopic.content.serviceProduct,
                              duration: e.target.value,
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white rounded border border-slate-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Service Description
                    </label>
                    <textarea
                      rows={2}
                      value={activeSubtopic.content.serviceProduct?.description || ''}
                      onChange={(e) =>
                        handleUpdateSubtopicContent(activeSubtopic.id, {
                          serviceProduct: {
                            ...activeSubtopic.content.serviceProduct,
                            description: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-white rounded border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Inclusions (one per line)
                    </label>
                    <textarea
                      rows={2}
                      value={(activeSubtopic.content.serviceProduct?.inclusions || []).join('\n')}
                      onChange={(e) =>
                        handleUpdateSubtopicContent(activeSubtopic.id, {
                          serviceProduct: {
                            ...activeSubtopic.content.serviceProduct,
                            inclusions: e.target.value.split('\n').filter((l) => l.trim()),
                          },
                        })
                      }
                      placeholder="e.g. 1-hour shooting time&#10;5 high-res digital proofs"
                      className="w-full px-2.5 py-1.5 text-xs bg-white rounded border border-slate-300 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Action Button Text
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Book Session or Request Quote"
                      value={activeSubtopic.content.serviceProduct?.actionLabel || ''}
                      onChange={(e) =>
                        handleUpdateSubtopicContent(activeSubtopic.id, {
                          serviceProduct: {
                            ...activeSubtopic.content.serviceProduct,
                            actionLabel: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-white rounded border border-slate-300"
                    />
                  </div>
                </div>
              )}

              {/* TYPE: INFORMATION */}
              {activeSubtopic.contentType === 'information' && (
                <div className="p-4 bg-slate-50/70 rounded-lg border border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Information Content
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Headline
                    </label>
                    <input
                      type="text"
                      value={activeSubtopic.content.information?.shortDescription || ''}
                      onChange={(e) =>
                        handleUpdateSubtopicContent(activeSubtopic.id, {
                          information: {
                            ...activeSubtopic.content.information,
                            shortDescription: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-white rounded border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Detailed Content
                    </label>
                    <textarea
                      rows={5}
                      value={activeSubtopic.content.information?.detailedContent || ''}
                      onChange={(e) =>
                        handleUpdateSubtopicContent(activeSubtopic.id, {
                          information: {
                            ...activeSubtopic.content.information,
                            detailedContent: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-white rounded border border-slate-300 leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* TYPE: FAQ */}
              {activeSubtopic.contentType === 'faq' && (
                <div className="p-4 bg-slate-50/70 rounded-lg border border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    FAQ Item
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Question
                    </label>
                    <input
                      type="text"
                      value={activeSubtopic.content.faq?.question || ''}
                      onChange={(e) =>
                        handleUpdateSubtopicContent(activeSubtopic.id, {
                          faq: {
                            ...activeSubtopic.content.faq,
                            question: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-white rounded border border-slate-300 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Approved Answer
                    </label>
                    <textarea
                      rows={4}
                      value={activeSubtopic.content.faq?.approvedAnswer || ''}
                      onChange={(e) =>
                        handleUpdateSubtopicContent(activeSubtopic.id, {
                          faq: {
                            ...activeSubtopic.content.faq,
                            approvedAnswer: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-white rounded border border-slate-300 leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* TYPE: GALLERY */}
              {activeSubtopic.contentType === 'gallery' && (
                <div className="p-4 bg-slate-50/70 rounded-lg border border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Gallery Details
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Gallery Title
                    </label>
                    <input
                      type="text"
                      value={activeSubtopic.content.gallery?.galleryName || ''}
                      onChange={(e) =>
                        handleUpdateSubtopicContent(activeSubtopic.id, {
                          gallery: {
                            ...activeSubtopic.content.gallery,
                            galleryName: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-white rounded border border-slate-300 font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Images (URL | Caption)
                    </label>
                    {activeSubtopic.content.gallery?.images?.map((img, iIdx) => (
                      <div key={iIdx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={img.url}
                          placeholder="Image URL"
                          onChange={(e) => {
                            const updatedImgs = [...activeSubtopic.content.gallery!.images];
                            updatedImgs[iIdx].url = e.target.value;
                            handleUpdateSubtopicContent(activeSubtopic.id, {
                              gallery: {
                                ...activeSubtopic.content.gallery,
                                images: updatedImgs,
                              },
                            });
                          }}
                          className="flex-1 px-2 py-1 text-xs bg-white rounded border border-slate-300"
                        />
                        <input
                          type="text"
                          value={img.caption}
                          placeholder="Caption"
                          onChange={(e) => {
                            const updatedImgs = [...activeSubtopic.content.gallery!.images];
                            updatedImgs[iIdx].caption = e.target.value;
                            handleUpdateSubtopicContent(activeSubtopic.id, {
                              gallery: {
                                ...activeSubtopic.content.gallery,
                                images: updatedImgs,
                              },
                            });
                          }}
                          className="w-36 px-2 py-1 text-xs bg-white rounded border border-slate-300"
                        />
                        <button
                          onClick={() => {
                            const filtered = activeSubtopic.content.gallery!.images.filter(
                              (_, i) => i !== iIdx
                            );
                            handleUpdateSubtopicContent(activeSubtopic.id, {
                              gallery: {
                                ...activeSubtopic.content.gallery,
                                images: filtered,
                              },
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={() => {
                        const existing = activeSubtopic.content.gallery?.images || [];
                        handleUpdateSubtopicContent(activeSubtopic.id, {
                          gallery: {
                            ...activeSubtopic.content.gallery,
                            images: [
                              ...existing,
                              {
                                url: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=800&q=80',
                                caption: 'New photo',
                              },
                            ],
                          },
                        });
                      }}
                      className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1 mt-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Image Slot
                    </button>
                  </div>
                </div>
              )}

              {/* TYPE: POLICY */}
              {activeSubtopic.contentType === 'policy' && (
                <div className="p-4 bg-slate-50/70 rounded-lg border border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Policy Information
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Policy Title
                    </label>
                    <input
                      type="text"
                      value={activeSubtopic.content.policy?.policyTitle || ''}
                      onChange={(e) =>
                        handleUpdateSubtopicContent(activeSubtopic.id, {
                          policy: {
                            ...activeSubtopic.content.policy,
                            policyTitle: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-white rounded border border-slate-300 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Policy Terms & Conditions
                    </label>
                    <textarea
                      rows={4}
                      value={activeSubtopic.content.policy?.policyText || ''}
                      onChange={(e) =>
                        handleUpdateSubtopicContent(activeSubtopic.id, {
                          policy: {
                            ...activeSubtopic.content.policy,
                            policyText: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-white rounded border border-slate-300 leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Effective Date
                    </label>
                    <input
                      type="date"
                      value={activeSubtopic.content.policy?.effectiveDate || ''}
                      onChange={(e) =>
                        handleUpdateSubtopicContent(activeSubtopic.id, {
                          policy: {
                            ...activeSubtopic.content.policy,
                            effectiveDate: e.target.value,
                          },
                        })
                      }
                      className="w-48 px-2.5 py-1.5 text-xs bg-white rounded border border-slate-300"
                    />
                  </div>
                </div>
              )}

              {/* TYPE: EXTERNAL LINK */}
              {activeSubtopic.contentType === 'external_link' && (
                <div className="p-4 bg-slate-50/70 rounded-lg border border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    External Link Navigation
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Button Label
                    </label>
                    <input
                      type="text"
                      value={activeSubtopic.content.externalLink?.linkLabel || ''}
                      onChange={(e) =>
                        handleUpdateSubtopicContent(activeSubtopic.id, {
                          externalLink: {
                            ...activeSubtopic.content.externalLink,
                            linkLabel: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-white rounded border border-slate-300 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Destination URL
                    </label>
                    <input
                      type="url"
                      value={activeSubtopic.content.externalLink?.destinationUrl || ''}
                      onChange={(e) =>
                        handleUpdateSubtopicContent(activeSubtopic.id, {
                          externalLink: {
                            ...activeSubtopic.content.externalLink,
                            destinationUrl: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-white rounded border border-slate-300"
                    />
                  </div>
                </div>
              )}

              {/* TYPE: ACTION / WORKFLOW */}
              {activeSubtopic.contentType === 'action' && (
                <div className="p-4 bg-slate-50/70 rounded-lg border border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Interactive Form / Action Workflow
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Form Title
                      </label>
                      <input
                        type="text"
                        value={activeSubtopic.content.action?.title || ''}
                        onChange={(e) =>
                          handleUpdateSubtopicContent(activeSubtopic.id, {
                            action: {
                              ...activeSubtopic.content.action,
                              title: e.target.value,
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white rounded border border-slate-300 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Submit Button Text
                      </label>
                      <input
                        type="text"
                        value={activeSubtopic.content.action?.submitButtonText || ''}
                        onChange={(e) =>
                          handleUpdateSubtopicContent(activeSubtopic.id, {
                            action: {
                              ...activeSubtopic.content.action,
                              submitButtonText: e.target.value,
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white rounded border border-slate-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Instructions / Description
                    </label>
                    <input
                      type="text"
                      value={activeSubtopic.content.action?.description || ''}
                      onChange={(e) =>
                        handleUpdateSubtopicContent(activeSubtopic.id, {
                          action: {
                            ...activeSubtopic.content.action,
                            description: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-white rounded border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Success Confirmation Message
                    </label>
                    <input
                      type="text"
                      value={activeSubtopic.content.action?.successMessage || ''}
                      onChange={(e) =>
                        handleUpdateSubtopicContent(activeSubtopic.id, {
                          action: {
                            ...activeSubtopic.content.action,
                            successMessage: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-white rounded border border-slate-300"
                    />
                  </div>
                </div>
              )}

              {/* TYPE: HUMAN ASSISTANCE */}
              {activeSubtopic.contentType === 'human_assistance' && (
                <div className="p-4 bg-slate-50/70 rounded-lg border border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Human Assistance Handoff Settings
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Introductory Message
                    </label>
                    <textarea
                      rows={2}
                      value={activeSubtopic.content.humanAssistance?.introductoryMessage || ''}
                      onChange={(e) =>
                        handleUpdateSubtopicContent(activeSubtopic.id, {
                          humanAssistance: {
                            ...activeSubtopic.content.humanAssistance,
                            introductoryMessage: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-white rounded border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Handoff Destination
                    </label>
                    <select
                      value={
                        activeSubtopic.content.humanAssistance?.handoffDestination ||
                        'dashboard_inbox'
                      }
                      onChange={(e) =>
                        handleUpdateSubtopicContent(activeSubtopic.id, {
                          humanAssistance: {
                            ...activeSubtopic.content.humanAssistance,
                            handoffDestination: e.target.value as any,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-white rounded border border-slate-300"
                    >
                      <option value="dashboard_inbox">
                        SelectBot Conversation Inbox (Recommended)
                      </option>
                      <option value="email">Forward to Business Email</option>
                      <option value="webhook">External CRM Webhook</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirmation Note to Customer
                    </label>
                    <input
                      type="text"
                      value={activeSubtopic.content.humanAssistance?.confirmationBehavior || ''}
                      onChange={(e) =>
                        handleUpdateSubtopicContent(activeSubtopic.id, {
                          humanAssistance: {
                            ...activeSubtopic.content.humanAssistance,
                            confirmationBehavior: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-white rounded border border-slate-300"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              Select or add a subtopic to configure its content, pricing, and action forms.
            </div>
          )}
        </div>

        {/* Live Interactive Preview Panel (Width: 420px) */}
        <div className="w-[440px] bg-slate-100 p-4 flex flex-col items-center justify-center shrink-0">
          <div className="w-full flex items-center justify-between mb-2 px-1 text-xs text-slate-500">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Live Interactive Preview
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncPreview}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-200/60 cursor-pointer transition-colors"
                title="Synchronize & reload preview session"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Sync Preview</span>
              </button>
              <span className="text-[11px] font-mono text-slate-400">
                {devicePreview === 'mobile' ? '390 × 660px' : '420 × 660px'}
              </span>
            </div>
          </div>

          <div
            className={`w-full h-[650px] transition-all ${
              devicePreview === 'mobile'
                ? 'max-w-[380px] rounded-2xl shadow-lg ring-8 ring-slate-800'
                : 'max-w-full rounded-xl shadow-md'
            }`}
          >
            <ChatPreview bot={currentBot} syncKey={previewSyncKey} />
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-rose-50 text-rose-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Delete {deleteConfirmModal.type === 'menu' ? 'Menu Option' : 'Subtopic'}?
                </h4>
                <p className="text-xs text-slate-500">
                  Are you sure you want to delete "{deleteConfirmModal.title}"? This cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmModal(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={
                  deleteConfirmModal.type === 'menu'
                    ? handleDeleteMenuConfirm
                    : handleDeleteSubtopicConfirm
                }
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
