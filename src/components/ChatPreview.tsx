import React, { useState, useEffect, useRef } from 'react';
import {
  ChatbotConfig,
  ChatMessage,
  Conversation,
  MainMenuItem,
  SubtopicItem,
  ActionField,
} from '../types';
import { api } from '../services/api';
import { formatCurrency } from '../utils/currency';
import {
  Send,
  RotateCcw,
  ArrowLeft,
  Menu as MenuIcon,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Sparkles,
  User,
  Clock,
  Tag,
  Calendar,
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
} from 'lucide-react';

interface ChatPreviewProps {
  bot: ChatbotConfig;
  isStandalone?: boolean;
  onRefreshStats?: () => void;
  syncKey?: number;
}

export function ChatPreview({ bot, isStandalone = false, onRefreshStats, syncKey }: ChatPreviewProps) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [actionFormData, setActionFormData] = useState<Record<string, any>>({});
  const [submittingAction, setSubmittingAction] = useState(false);

  // Handoff form state
  const [handoffName, setHandoffName] = useState('');
  const [handoffContact, setHandoffContact] = useState('');
  const [handoffMsg, setHandoffMsg] = useState('');
  const [submittingHandoff, setSubmittingHandoff] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Navigation history stack for Back button
  const [navHistory, setNavHistory] = useState<
    { type: 'main' | 'subtopic' | 'content'; menuId?: string; subtopicId?: string }[]
  >([{ type: 'main' }]);

  const initSession = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.startChatSession(bot.id);
      setConversation(res.conversation);
      setNavHistory([{ type: 'main' }]);
      setActionFormData({});
      setHandoffMsg('');
    } catch (err: any) {
      console.error('Failed to init session', err);
      setError(err.message || 'Could not start chat session');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initSession();
  }, [bot.id, syncKey]);

  // Live synchronisation: When creator edits menu items, titles, or greeting in the builder,
  // update the active main menu preview immediately without message buildup or manual refresh
  useEffect(() => {
    if (!conversation) return;
    if (navHistory.length === 1 && navHistory[0].type === 'main') {
      const activeMenuItems = bot.mainMenuItems
        .filter((m) => !m.isHidden)
        .map((m) => ({ id: m.id, title: m.title, description: m.description, icon: m.icon }));

      setConversation((prev) => {
        if (!prev) return prev;
        const updatedMessages = prev.messages.map((m) => {
          if (m.payload?.type === 'menu') {
            return {
              ...m,
              text: bot.appearance.greetingMessage || `Hey! Welcome to ${bot.businessName}. How can we help you today?`,
              payload: {
                ...m.payload,
                menuItems: activeMenuItems,
              },
            };
          }
          return m;
        });
        return { ...prev, messages: updatedMessages };
      });
    }
  }, [bot.mainMenuItems, bot.appearance.greetingMessage, bot.businessName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages, loading]);

  const handleSelectMenu = async (menuId: string) => {
    if (!conversation || loading) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.sendChatMessage({
        conversationId: conversation.id,
        botId: bot.id,
        selectedMenuId: menuId,
      });
      setConversation(res.conversation);
      setNavHistory((prev) => [...prev, { type: 'subtopic', menuId }]);
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      setError(err.message || 'Failed to select option');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSubtopic = async (menuId: string, subtopicId: string) => {
    if (!conversation || loading) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.sendChatMessage({
        conversationId: conversation.id,
        botId: bot.id,
        selectedMenuId: menuId,
        selectedSubtopicId: subtopicId,
      });
      setConversation(res.conversation);
      setNavHistory((prev) => [...prev, { type: 'content', menuId, subtopicId }]);
      setActionFormData({});
      setHandoffMsg('');
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      setError(err.message || 'Failed to select subtopic');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Return to Main Options
   * Clears the active conversation view and displays the clean main menu
   * to avoid message buildup, while keeping state and backend data intact.
   */
  const handleReturnToMainMenu = () => {
    if (loading) return;
    if (navHistory.length === 1 && navHistory[0].type === 'main') return;
    setError(null);
    setNavHistory([{ type: 'main' }]);
    setActionFormData({});
    setHandoffMsg('');

    if (conversation) {
      const cleanGreeting: ChatMessage = {
        id: `msg_init_${Date.now()}`,
        conversationId: conversation.id,
        sender: 'bot',
        text: bot.appearance.greetingMessage || `Hey! Welcome to ${bot.businessName}. How can we help you today?`,
        timestamp: new Date().toISOString(),
        payload: {
          type: 'menu',
          menuItems: bot.mainMenuItems
            .filter((m) => !m.isHidden)
            .map((m) => ({ id: m.id, title: m.title, description: m.description, icon: m.icon })),
        },
      };
      setConversation({
        ...conversation,
        messages: [cleanGreeting],
      });
    }
  };

  const handleBack = () => {
    if (navHistory.length <= 1) {
      handleReturnToMainMenu();
      return;
    }
    const previous = navHistory[navHistory.length - 2];
    setNavHistory((prev) => prev.slice(0, -1));

    if (previous.type === 'main') {
      handleReturnToMainMenu();
    } else if (previous.type === 'subtopic' && previous.menuId) {
      handleSelectMenu(previous.menuId);
    }
  };

  const handleSendTextMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !conversation || loading) return;

    const query = inputText.trim();
    setInputText('');
    setLoading(true);
    setError(null);

    try {
      const res = await api.sendChatMessage({
        conversationId: conversation.id,
        botId: bot.id,
        text: query,
      });
      setConversation(res.conversation);
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      setError(err.message || 'Message could not be sent');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitActionForm = async (action: any) => {
    if (!conversation || submittingAction) return;
    setSubmittingAction(true);
    setError(null);

    try {
      const res = await api.sendChatMessage({
        conversationId: conversation.id,
        botId: bot.id,
        actionSubmission: {
          actionId: action.actionId,
          actionTitle: action.title,
          formData: actionFormData,
        },
      });
      setConversation(res.conversation);
      setActionFormData({});
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      setError(err.message || 'Failed to submit form');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSubmitHandoff = async (handoffConfig: any) => {
    if (!conversation || submittingHandoff) return;
    if (!handoffMsg.trim()) {
      setError('Please provide a short message for the team.');
      return;
    }
    setSubmittingHandoff(true);
    setError(null);

    try {
      const res = await api.sendChatMessage({
        conversationId: conversation.id,
        botId: bot.id,
        handoffSubmission: {
          customerName: handoffName.trim() || 'Visitor',
          customerContact: handoffContact.trim() || 'Not specified',
          message: handoffMsg.trim(),
          handoffDestination: handoffConfig.handoffDestination || 'dashboard_inbox',
        },
      });
      setConversation(res.conversation);
      setHandoffMsg('');
      setHandoffName('');
      setHandoffContact('');
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      setError(err.message || 'Failed to submit request');
    } finally {
      setSubmittingHandoff(false);
    }
  };

  const renderIcon = (iconName?: string) => {
    switch (iconName) {
      case 'camera':
        return <Camera className="w-4 h-4 text-slate-500" />;
      case 'utensils':
        return <Utensils className="w-4 h-4 text-slate-500" />;
      case 'car':
        return <Car className="w-4 h-4 text-slate-500" />;
      case 'scissors':
        return <Scissors className="w-4 h-4 text-slate-500" />;
      case 'briefcase':
        return <Briefcase className="w-4 h-4 text-slate-500" />;
      case 'file-text':
        return <FileText className="w-4 h-4 text-slate-500" />;
      case 'truck':
        return <Truck className="w-4 h-4 text-slate-500" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-slate-500" />;
      case 'user':
        return <User className="w-4 h-4 text-slate-500" />;
      case 'calendar':
        return <Calendar className="w-4 h-4 text-slate-500" />;
      default:
        return <Tag className="w-4 h-4 text-slate-500" />;
    }
  };

  // Find active menu for subtopic breadcrumb
  const currentNav = navHistory[navHistory.length - 1];
  const activeMenu = bot.mainMenuItems.find((m) => m.id === currentNav.menuId);
  const brandColor = bot.appearance.brandColor || '#4f46e5';

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-slate-900">
      {/* Widget Header */}
      <div
        className="px-4 py-3.5 flex items-center justify-between text-white shrink-0"
        style={{ backgroundColor: brandColor }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 text-white font-semibold text-sm">
            {bot.appearance.botDisplayName ? bot.appearance.botDisplayName.charAt(0) : 'S'}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold truncate leading-tight">
              {bot.appearance.botDisplayName || bot.businessName}
            </h4>
            <p className="text-[11px] text-white/80 truncate">{bot.businessName}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {navHistory.length > 1 && (
            <button
              onClick={handleBack}
              title="Go back"
              className="p-1.5 rounded hover:bg-white/15 text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={initSession}
            title="Reset conversation"
            className="p-1.5 rounded hover:bg-white/15 text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Breadcrumb Navigation Ribbon */}
      {navHistory.length > 1 && (
        <div className="px-3.5 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-1.5 truncate">
            <button
              onClick={handleReturnToMainMenu}
              className="font-medium text-slate-700 hover:text-slate-900 cursor-pointer"
            >
              Main options
            </button>
            {activeMenu && (
              <>
                <span className="text-slate-400">/</span>
                <span className="truncate text-slate-900 font-medium">{activeMenu.title}</span>
              </>
            )}
          </div>
          <button
            onClick={handleReturnToMainMenu}
            className="text-[11.5px] font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>← Main options</span>
          </button>
        </div>
      )}

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
        {conversation?.messages.map((msg) => {
          const isUser = msg.sender === 'customer';
          const isAgent = msg.sender === 'agent';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
            >
              {/* Message Bubble */}
              <div
                className={`rounded-2xl px-3.5 py-2.5 max-w-[88%] text-[13.5px] leading-relaxed shadow-xs ${
                  isUser
                    ? 'text-white rounded-br-xs'
                    : isAgent
                    ? 'bg-emerald-50 text-emerald-950 border border-emerald-200 rounded-bl-xs'
                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                }`}
                style={isUser ? { backgroundColor: brandColor } : {}}
              >
                {isAgent && (
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 mb-1">
                    <User className="w-3 h-3" />
                    Human Agent Response
                  </div>
                )}
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* AI Source Confidence Attribution */}
                {msg.payload?.sourceConfidence && (
                  <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center gap-1 text-[10.5px] text-slate-500">
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    <span>
                      {msg.payload.sourceConfidence === 'knowledge_base'
                        ? 'Verified from Knowledge Base'
                        : msg.payload.sourceConfidence === 'verified_record'
                        ? 'Verified from Business Catalog'
                        : 'AI Concierge'}
                    </span>
                  </div>
                )}
              </div>

              {/* Payload: Main Menu Items Buttons */}
              {msg.payload?.type === 'menu' && msg.payload.menuItems && (
                <div className="w-full mt-2.5 space-y-1.5 max-w-[92%]">
                  {msg.payload.menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectMenu(item.id)}
                      disabled={loading}
                      className="w-full text-left p-2.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition-all flex items-start gap-2.5 cursor-pointer disabled:opacity-50 group"
                    >
                      <div className="mt-0.5 p-1 rounded bg-slate-100 text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shrink-0">
                        {renderIcon(item.icon)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {item.title}
                        </div>
                        {item.description && (
                          <div className="text-[11.5px] text-slate-500 truncate mt-0.5">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Payload: Subtopics Buttons */}
              {msg.payload?.type === 'subtopic' && msg.payload.subtopics && activeMenu && (
                <div className="w-full mt-2.5 space-y-1.5 max-w-[92%]">
                  {msg.payload.subtopics.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => handleSelectSubtopic(activeMenu.id, sub.id)}
                      disabled={loading}
                      className="w-full text-left p-2.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition-all flex items-center justify-between gap-2 cursor-pointer disabled:opacity-50 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {sub.title}
                        </div>
                        {sub.description && (
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {sub.description}
                          </div>
                        )}
                      </div>
                      <span className="text-[10.5px] font-medium uppercase tracking-wider text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                        {sub.contentType.replace('_', ' ')}
                      </span>
                    </button>
                  ))}

                  {/* Return to Main Options Button at the end of subtopic options */}
                  <div className="pt-2 flex justify-start">
                    <button
                      type="button"
                      onClick={handleReturnToMainMenu}
                      disabled={loading}
                      className="inline-flex items-center gap-1 text-[11.5px] text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md transition-colors cursor-pointer shadow-2xs"
                      title="Return directly to main options"
                    >
                      <span>← Main options</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Payload: Content View Card */}
              {msg.payload?.type === 'content' && msg.payload.contentView && (
                <div className="w-full mt-2.5 max-w-[95%] bg-white rounded-lg border border-slate-200 p-3.5 space-y-2.5">
                  <h5 className="text-[14px] font-semibold text-slate-900 border-b border-slate-100 pb-1.5">
                    {msg.payload.contentView.title}
                  </h5>

                  {/* Service / Product Display with South African Rand (R) */}
                  {msg.payload.contentView.contentType === 'service_product' &&
                    msg.payload.contentView.data.serviceProduct && (
                      <div className="space-y-2 text-xs">
                        <div className="flex items-baseline justify-between">
                          <span className="font-semibold text-slate-700">
                            {msg.payload.contentView.data.serviceProduct.name}
                          </span>
                          <span className="text-sm font-bold text-indigo-600 font-mono tabular-nums">
                            {formatCurrency(msg.payload.contentView.data.serviceProduct.price)}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                          {msg.payload.contentView.data.serviceProduct.description}
                        </p>

                        {msg.payload.contentView.data.serviceProduct.duration && (
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Duration: {msg.payload.contentView.data.serviceProduct.duration}</span>
                          </div>
                        )}

                        {msg.payload.contentView.data.serviceProduct.inclusions?.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-100">
                            <div className="font-medium text-slate-700 mb-1">What is included:</div>
                            <ul className="space-y-1">
                              {msg.payload.contentView.data.serviceProduct.inclusions.map(
                                (inc: string, i: number) => (
                                  <li key={i} className="flex items-start gap-1.5 text-slate-600">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                    <span>{inc}</span>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}

                        {msg.payload.contentView.data.serviceProduct.exclusions?.length > 0 && (
                          <div className="mt-1 text-[11px] text-slate-500">
                            Conditions: {msg.payload.contentView.data.serviceProduct.exclusions.join(' · ')}
                          </div>
                        )}

                        {msg.payload.contentView.data.serviceProduct.actionLabel && (
                          <button
                            onClick={() => {
                              handleSelectSubtopic(
                                activeMenu?.id || 'menu_services',
                                'sub_book_table'
                              );
                            }}
                            className="w-full mt-2 py-2 px-3 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            {msg.payload.contentView.data.serviceProduct.actionLabel}
                          </button>
                        )}
                      </div>
                    )}

                  {/* Information Display */}
                  {msg.payload.contentView.contentType === 'information' &&
                    msg.payload.contentView.data.information && (
                      <div className="text-xs space-y-1.5 text-slate-600 leading-relaxed">
                        <div className="font-medium text-slate-800">
                          {msg.payload.contentView.data.information.shortDescription}
                        </div>
                        <div className="whitespace-pre-wrap">
                          {msg.payload.contentView.data.information.detailedContent}
                        </div>
                      </div>
                    )}

                  {/* FAQ Display */}
                  {msg.payload.contentView.contentType === 'faq' &&
                    msg.payload.contentView.data.faq && (
                      <div className="text-xs space-y-1.5">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                          {msg.payload.contentView.data.faq.question}
                        </div>
                        <div className="text-slate-600 leading-relaxed pl-5">
                          {msg.payload.contentView.data.faq.approvedAnswer}
                        </div>
                      </div>
                    )}

                  {/* Gallery Display */}
                  {msg.payload.contentView.contentType === 'gallery' &&
                    msg.payload.contentView.data.gallery && (
                      <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          {msg.payload.contentView.data.gallery.images?.map((img: any, i: number) => (
                            <div key={i} className="group relative rounded overflow-hidden border border-slate-200">
                              <img
                                src={img.url}
                                alt={img.caption || 'Portfolio image'}
                                referrerPolicy="no-referrer"
                                className="w-full h-24 object-cover"
                              />
                              {img.caption && (
                                <div className="p-1 bg-white text-[10.5px] text-slate-700 truncate">
                                  {img.caption}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {msg.payload.contentView.data.gallery.approvedPortfolioLinks?.map(
                          (link: any, i: number) => (
                            <a
                              key={i}
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline pt-1"
                            >
                              <span>{link.label}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )
                        )}
                      </div>
                    )}

                  {/* Policy Display */}
                  {msg.payload.contentView.contentType === 'policy' &&
                    msg.payload.contentView.data.policy && (
                      <div className="text-xs space-y-1.5 text-slate-600">
                        <div className="font-medium text-slate-800">
                          {msg.payload.contentView.data.policy.policyTitle}
                        </div>
                        <p className="leading-relaxed">
                          {msg.payload.contentView.data.policy.policyText}
                        </p>
                        {msg.payload.contentView.data.policy.effectiveDate && (
                          <div className="text-[10.5px] text-slate-400">
                            Effective Date: {msg.payload.contentView.data.policy.effectiveDate}
                          </div>
                        )}
                      </div>
                    )}

                  {/* External Link */}
                  {msg.payload.contentView.contentType === 'external_link' &&
                    msg.payload.contentView.data.externalLink && (
                      <div className="text-xs space-y-2">
                        {msg.payload.contentView.data.externalLink.description && (
                          <p className="text-slate-600">
                            {msg.payload.contentView.data.externalLink.description}
                          </p>
                        )}
                        <a
                          href={msg.payload.contentView.data.externalLink.destinationUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 w-full py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 transition-colors"
                        >
                          <span>{msg.payload.contentView.data.externalLink.linkLabel}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}

                  {/* Return to Main Options Button at the end of content */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleReturnToMainMenu}
                      disabled={loading}
                      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-md transition-colors cursor-pointer shadow-2xs"
                      title="Return directly to main options"
                    >
                      <span>← Main options</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Payload: Interactive Action Form (Bookings, Quotes, Leads) */}
              {msg.payload?.type === 'action_form' && msg.payload.actionForm && (
                <div className="w-full mt-2.5 max-w-[95%] bg-white rounded-lg border border-slate-200 p-3.5 space-y-2.5">
                  <div className="border-b border-slate-100 pb-2">
                    <h5 className="text-[13.5px] font-semibold text-slate-900">
                      {msg.payload.actionForm.title}
                    </h5>
                    {msg.payload.actionForm.description && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {msg.payload.actionForm.description}
                      </p>
                    )}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSubmitActionForm(msg.payload!.actionForm);
                    }}
                    className="space-y-2 text-xs"
                  >
                    {msg.payload.actionForm.fields?.map((field: ActionField) => (
                      <div key={field.id} className="space-y-1">
                        <label className="block text-[11.5px] font-medium text-slate-700">
                          {field.label} {field.required && <span className="text-rose-500">*</span>}
                        </label>

                        {field.type === 'select' ? (
                          <select
                            required={field.required}
                            value={actionFormData[field.id] || ''}
                            onChange={(e) =>
                              setActionFormData({ ...actionFormData, [field.id]: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          >
                            <option value="">Select an option...</option>
                            {field.options?.map((opt: string, i: number) => (
                              <option key={i} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : field.type === 'textarea' ? (
                          <textarea
                            required={field.required}
                            placeholder={field.placeholder}
                            value={actionFormData[field.id] || ''}
                            onChange={(e) =>
                              setActionFormData({ ...actionFormData, [field.id]: e.target.value })
                            }
                            rows={2}
                            className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        ) : (
                          <input
                            type={field.type}
                            required={field.required}
                            placeholder={field.placeholder}
                            value={actionFormData[field.id] || ''}
                            onChange={(e) =>
                              setActionFormData({ ...actionFormData, [field.id]: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        )}
                      </div>
                    ))}

                    <button
                      type="submit"
                      disabled={submittingAction}
                      className="w-full mt-3 py-2 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {submittingAction
                        ? 'Submitting...'
                        : msg.payload.actionForm.submitButtonText || 'Submit Request'}
                    </button>
                  </form>

                  <div className="pt-1.5 flex justify-start">
                    <button
                      type="button"
                      onClick={handleReturnToMainMenu}
                      disabled={loading}
                      className="inline-flex items-center gap-1 text-[11.5px] text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                    >
                      <span>← Main options</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Payload: Action Success */}
              {msg.payload?.type === 'action_success' && (
                <div className="mt-2 flex justify-start">
                  <button
                    type="button"
                    onClick={handleReturnToMainMenu}
                    disabled={loading}
                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
                  >
                    <span>← Main options</span>
                  </button>
                </div>
              )}

              {/* Payload: Human Assistance Handoff Form */}
              {msg.payload?.type === 'handoff_form' && msg.payload.handoffForm && (
                <div className="w-full mt-2.5 max-w-[95%] bg-white rounded-lg border border-slate-200 p-3.5 space-y-2.5">
                  <div className="border-b border-slate-100 pb-2">
                    <h5 className="text-[13.5px] font-semibold text-slate-900 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-indigo-600" />
                      Contact Business Team
                    </h5>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {msg.payload.handoffForm.introductoryMessage}
                    </p>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSubmitHandoff(msg.payload!.handoffForm);
                    }}
                    className="space-y-2 text-xs"
                  >
                    <div>
                      <label className="block text-[11.5px] font-medium text-slate-700">
                        Your Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Eleanor Vance"
                        value={handoffName}
                        onChange={(e) => setHandoffName(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11.5px] font-medium text-slate-700">
                        Contact Info (Email or Phone) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. eleanor@example.co.za or 082 123 4567"
                        value={handoffContact}
                        onChange={(e) => setHandoffContact(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11.5px] font-medium text-slate-700">
                        Your Message <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder={
                          msg.payload.handoffForm.customerMessagePlaceholder ||
                          'How can our team help you?'
                        }
                        value={handoffMsg}
                        onChange={(e) => setHandoffMsg(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingHandoff}
                      className="w-full mt-2 py-2 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {submittingHandoff ? 'Submitting to team...' : 'Send Message to Team'}
                    </button>
                  </form>

                  <div className="pt-1.5 flex justify-start">
                    <button
                      type="button"
                      onClick={handleReturnToMainMenu}
                      disabled={loading}
                      className="inline-flex items-center gap-1 text-[11.5px] text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                    >
                      <span>← Main options</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Payload: Handoff Success */}
              {msg.payload?.type === 'handoff_success' && (
                <div className="mt-2 flex justify-start">
                  <button
                    type="button"
                    onClick={handleReturnToMainMenu}
                    disabled={loading}
                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
                  >
                    <span>← Main options</span>
                  </button>
                </div>
              )}

              {/* Payload: AI Response */}
              {msg.payload?.type === 'ai_response' && (
                <div className="mt-2 flex justify-start">
                  <button
                    type="button"
                    onClick={handleReturnToMainMenu}
                    disabled={loading}
                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md transition-colors cursor-pointer shadow-2xs"
                  >
                    <span>← Main options</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 py-1 pl-1">
            <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
            <span
              className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
              style={{ animationDelay: '0.15s' }}
            />
            <span
              className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
              style={{ animationDelay: '0.3s' }}
            />
            <span className="ml-1 text-[11px] text-slate-400">Assistant is thinking...</span>
          </div>
        )}

        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-2.5 bg-white border-t border-slate-200 shrink-0">
        <form onSubmit={handleSendTextMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
            placeholder={
              bot.conversationStyle === 'guided'
                ? 'Select an option above (Guided mode)...'
                : 'Type a question or select from menu...'
            }
            className="flex-1 px-3 py-2 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-slate-900"
          />
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            style={{ backgroundColor: brandColor }}
            className="p-2 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-slate-400">
          <span>Powered by SelectBot</span>
          <span className="uppercase tracking-wider">{bot.conversationStyle} engine</span>
        </div>
      </div>
    </div>
  );
}
