import React from 'react';
import { ChatbotConfig, BotAnalytics, Workspace } from '../types';
import {
  Plus,
  MessageSquare,
  Bot,
  Globe,
  Clock,
  ArrowRight,
  TrendingUp,
  Inbox,
  AlertCircle,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface DashboardViewProps {
  bots: ChatbotConfig[];
  currentWorkspace?: Workspace;
  analytics: BotAnalytics | null;
  onSelectBot: (botId: string, view: 'builder' | 'knowledge' | 'inbox' | 'deployment' | 'appearance') => void;
  onOpenCreateBotModal: () => void;
  onNavigateTab: (tab: string) => void;
}

export function DashboardView({
  bots,
  currentWorkspace,
  analytics,
  onSelectBot,
  onOpenCreateBotModal,
  onNavigateTab,
}: DashboardViewProps) {
  const publishedBots = bots.filter((b) => b.status === 'published');
  const unresolvedHandoffs = analytics?.unresolvedHandoffRequests ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Welcome & Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome to SelectBot
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Workspace: <span className="font-semibold text-slate-800">{currentWorkspace?.name || 'Default Workspace'}</span> · Configure your business menus and let customers select what they need.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('inbox')}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Inbox className="w-4 h-4 text-slate-500" />
            <span>Conversation Inbox</span>
            {unresolvedHandoffs > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-bold">
                {unresolvedHandoffs}
              </span>
            )}
          </button>

          <button
            onClick={onOpenCreateBotModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Chatbot</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Chatbots</span>
            <Bot className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {bots.length}
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
            <span className="font-medium text-slate-700">{publishedBots.length}</span> published live
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Published Bots</span>
            <Globe className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {publishedBots.length}
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
            <span>Ready for website & embed</span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Conversations</span>
            <MessageSquare className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {analytics?.totalConversations ?? 0}
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
            <span className="font-medium text-slate-700">{analytics?.totalMessages ?? 0}</span> messages exchanged
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Human Handoff Requests</span>
            <Inbox className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {analytics?.totalHandoffRequests ?? 0}
          </div>
          <div className="text-xs flex items-center gap-1.5 pt-1">
            {unresolvedHandoffs > 0 ? (
              <span className="text-rose-600 font-medium">
                {unresolvedHandoffs} awaiting response
              </span>
            ) : (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> All caught up
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content 2-Column Split: Chatbots List vs Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chatbots Catalog (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Your Configured Chatbots ({bots.length})
            </h2>
            <button
              onClick={onOpenCreateBotModal}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> New Bot
            </button>
          </div>

          {bots.length === 0 ? (
            <div className="p-8 bg-white rounded-xl border border-dashed border-slate-300 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No Chatbots Created Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Get started by creating your first chatbot using one of our verified industry templates or a custom blank setup.
              </p>
              <button
                onClick={onOpenCreateBotModal}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create Your First Chatbot
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {bots.map((bot) => (
                <div
                  key={bot.id}
                  className="p-5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: bot.appearance.brandColor || '#4f46e5' }}
                      >
                        {bot.businessName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 leading-tight">
                            {bot.name}
                          </h3>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              bot.status === 'published'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {bot.status === 'published' ? 'Published' : 'Draft'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {bot.businessName} · <span className="font-medium text-slate-700">{bot.industry}</span>
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {bot.conversationStyle} mode
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {bot.description || 'Universal business assistant configured for customer navigation and automated services.'}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                      <span>{bot.mainMenuItems.length} menu items</span>
                      <span>·</span>
                      <span>
                        Updated {new Date(bot.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectBot(bot.id, 'knowledge')}
                        className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 font-medium hover:bg-slate-100 rounded transition-colors cursor-pointer"
                      >
                        Knowledge
                      </button>
                      <button
                        onClick={() => onSelectBot(bot.id, 'deployment')}
                        className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 font-medium hover:bg-slate-100 rounded transition-colors cursor-pointer"
                      >
                        Deploy
                      </button>
                      <button
                        onClick={() => onSelectBot(bot.id, 'builder')}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        Open Builder <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Rail: Recent Activity & Quick Stats (1 Col) */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Quick Actions
            </h3>
            <div className="space-y-1.5 text-xs">
              <button
                onClick={onOpenCreateBotModal}
                className="w-full text-left p-2 rounded-lg hover:bg-slate-50 flex items-center justify-between text-slate-700 font-medium cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-600" />
                  <span>Create a New Chatbot</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigateTab('inbox')}
                className="w-full text-left p-2 rounded-lg hover:bg-slate-50 flex items-center justify-between text-slate-700 font-medium cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-emerald-600" />
                  <span>Open Human Assistance Inbox</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigateTab('actions')}
                className="w-full text-left p-2 rounded-lg hover:bg-slate-50 flex items-center justify-between text-slate-700 font-medium cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>View Action Submissions & Bookings</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigateTab('analytics')}
                className="w-full text-left p-2 rounded-lg hover:bg-slate-50 flex items-center justify-between text-slate-700 font-medium cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span>Real Analytics & Top Menu Clicks</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Stored Recent Activity Stream */}
          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Recent Bot Activity
              </h3>
              <Clock className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {analytics.recentActivity.map((act) => (
                  <div key={act.id} className="text-xs space-y-0.5 border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{act.type}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11.5px] line-clamp-1">{act.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center">
                No recent activity recorded yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
