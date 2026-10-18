import React, { useState, useEffect, useCallback } from 'react';
import { ChatbotConfig, Workspace, BotAnalytics } from './types';
import { api } from './services/api';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ConversationBuilder } from './components/ConversationBuilder';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { InboxView } from './components/InboxView';
import { ActionsView } from './components/ActionsView';
import { AppearanceView } from './components/AppearanceView';
import { DeploymentView } from './components/DeploymentView';
import { AnalyticsView } from './components/AnalyticsView';
import { CreateBotModal } from './components/CreateBotModal';
import { ChatPreview } from './components/ChatPreview';
import { LoginView } from './components/LoginView';
import { ChevronDown, AlertCircle, RefreshCw } from 'lucide-react';

import { useFirebaseAuth } from './context/FirebaseAuthContext';
import { firestoreSync } from './services/firestoreSync';
import { firebaseAuthService } from './services/firebaseAuthService';

export default function App() {
  const { user, loading: authLoading, signInWithGoogle } = useFirebaseAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guestMode, setGuestMode] = useState(false);

  // Core Data
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | undefined>();
  const [bots, setBots] = useState<ChatbotConfig[]>([]);
  const [activeBotId, setActiveBotId] = useState<string>('');
  const [analytics, setAnalytics] = useState<BotAnalytics | null>(null);

  // Navigation
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Check if page is rendered in iframe embed mode (?embed=true&deploymentId=...)
  const urlParams = new URLSearchParams(window.location.search);
  const isEmbedMode = urlParams.get('embed') === 'true';
  const embedDeploymentId = urlParams.get('deploymentId');

  const [embedBot, setEmbedBot] = useState<ChatbotConfig | null>(null);
  const [embedError, setEmbedError] = useState<string | null>(null);

  // Load App Data from Firebase & Firestore as the single source of truth
  const loadAppData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (user) {
        // Authenticated user: Initialize from Firestore
        const session = await firebaseAuthService.initUserSession(user);
        setWorkspaces(session.workspaces);
        const activeWs = session.currentWorkspace || session.workspaces[0];
        setCurrentWorkspace(activeWs);
        setBots(session.bots);

        if (session.bots.length > 0) {
          setActiveBotId((prev) => (prev && session.bots.some((b) => b.id === prev) ? prev : session.bots[0].id));
        }
        setAnalytics(session.analytics);
      } else if (guestMode) {
        // Guest mode fallback
        const session = firebaseAuthService.getGuestSession();
        setWorkspaces(session.workspaces);
        setCurrentWorkspace(session.currentWorkspace || session.workspaces[0]);
        setBots(session.bots);
        if (session.bots.length > 0) {
          setActiveBotId(session.bots[0].id);
        }
        setAnalytics(session.analytics);
      }
    } catch (err: any) {
      console.error('Failed to initialize app from Firebase', err);
      setError(err?.message || 'Failed to initialize application from Firestore.');
    } finally {
      setLoading(false);
    }
  }, [user, guestMode]);

  // Main bootstrap sequence
  useEffect(() => {
    if (isEmbedMode && embedDeploymentId) {
      // In embed mode, fetch public bot by deployment ID directly
      api
        .getPublicBot(embedDeploymentId)
        .then((publicBot) => {
          setEmbedBot(publicBot);
          setLoading(false);
        })
        .catch((err) => {
          setEmbedError(err?.message || 'This chatbot widget is currently disabled or in draft mode.');
          setLoading(false);
        });
      return;
    }

    if (authLoading) {
      // Waiting for Firebase auth state resolution
      return;
    }

    if (user || guestMode) {
      loadAppData();
    } else {
      setLoading(false);
    }
  }, [isEmbedMode, embedDeploymentId, authLoading, user, guestMode, loadAppData]);

  // Update a single bot in state & sync to Firestore if authenticated
  const handleUpdateBot = (updated: ChatbotConfig) => {
    setBots((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    const uid = user?.uid || (guestMode ? 'guest_user' : null);
    if (uid) {
      firestoreSync.saveChatbot(updated, uid).catch((e) => {
        console.warn('Firestore bot sync notice:', e);
      });
    }
  };

  const handleBotCreated = (newBot: ChatbotConfig) => {
    setBots((prev) => [newBot, ...prev]);
    setActiveBotId(newBot.id);
    setCurrentTab('builder');
    const uid = user?.uid || (guestMode ? 'guest_user' : null);
    if (uid) {
      firestoreSync.saveChatbot(newBot, uid).catch((e) => {
        console.warn('Firestore new bot sync notice:', e);
      });
    }
    // Refresh analytics
    api.getAnalytics().then(setAnalytics).catch(console.error);
  };

  // Embed Mode View (Full iframe chat screen)
  if (isEmbedMode) {
    if (loading) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-white text-xs text-slate-500">
          Loading chatbot...
        </div>
      );
    }
    if (embedError) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 text-xs max-w-sm">
            {embedError}
          </div>
        </div>
      );
    }
    if (embedBot) {
      return (
        <div className="h-screen w-screen bg-transparent p-0 overflow-hidden">
          <ChatPreview bot={embedBot} isStandalone />
        </div>
      );
    }
  }

  // Loading state while resolving auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-base shadow-xs">
            S
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
            <span>Connecting to Firebase & Cloud Firestore...</span>
          </div>
        </div>
      </div>
    );
  }

  // Unauthenticated Guard: Show LoginView with Google Sign-in & Guest Access
  if (!user && !guestMode) {
    return (
      <LoginView
        onSignInWithGoogle={signInWithGoogle}
        onContinueAsGuest={() => setGuestMode(true)}
      />
    );
  }

  const activeBot = bots.find((b) => b.id === activeBotId) || bots[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans antialiased">
      {/* Top Bar Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenCreateBotModal={() => setIsCreateModalOpen(true)}
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        unresolvedCount={analytics?.unresolvedHandoffRequests || 0}
      />

      {/* Bot Selector Sub-Bar (Visible when inside bot-specific tabs like builder, knowledge, appearance, deployment) */}
      {currentTab !== 'dashboard' && currentTab !== 'inbox' && currentTab !== 'actions' && currentTab !== 'analytics' && activeBot && (
        <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Active Chatbot:</span>
            <div className="relative inline-block">
              <select
                value={activeBot.id}
                onChange={(e) => setActiveBotId(e.target.value)}
                className="pl-2.5 pr-8 py-1 rounded-md border border-slate-300 font-bold text-slate-900 bg-slate-50 hover:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none"
              >
                {bots.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.businessName})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2 pointer-events-none" />
            </div>

            <span className="text-slate-400">·</span>
            <span className="text-slate-600 font-medium">{activeBot.industry}</span>

            <span
              className={`ml-2 text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${
                activeBot.status === 'published'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {activeBot.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentTab('builder')}
              className={`px-2.5 py-1 rounded transition-colors font-medium cursor-pointer ${
                currentTab === 'builder' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Builder
            </button>
            <button
              onClick={() => setCurrentTab('knowledge')}
              className={`px-2.5 py-1 rounded transition-colors font-medium cursor-pointer ${
                currentTab === 'knowledge' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Knowledge Base
            </button>
            <button
              onClick={() => setCurrentTab('appearance')}
              className={`px-2.5 py-1 rounded transition-colors font-medium cursor-pointer ${
                currentTab === 'appearance' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Appearance
            </button>
            <button
              onClick={() => setCurrentTab('deployment')}
              className={`px-2.5 py-1 rounded transition-colors font-medium cursor-pointer ${
                currentTab === 'deployment' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Deploy & Embed
            </button>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-xs text-slate-500">
            <RefreshCw className="w-4 h-4 animate-spin mr-2 text-indigo-600" />
            Loading SelectBot Platform...
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto my-12 p-5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-rose-900">
              <AlertCircle className="w-4 h-4" /> Connection Notice
            </div>
            <p>{error}</p>
            <button
              onClick={loadAppData}
              className="mt-2 px-3 py-1.5 bg-rose-600 text-white rounded font-semibold text-xs hover:bg-rose-700 cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <DashboardView
                bots={bots}
                currentWorkspace={currentWorkspace}
                analytics={analytics}
                onSelectBot={(botId, view) => {
                  setActiveBotId(botId);
                  setCurrentTab(view);
                }}
                onOpenCreateBotModal={() => setIsCreateModalOpen(true)}
                onNavigateTab={setCurrentTab}
              />
            )}

            {currentTab === 'builder' && activeBot && (
              <ConversationBuilder
                bot={activeBot}
                onUpdateBot={handleUpdateBot}
                onRefreshAll={loadAppData}
              />
            )}

            {currentTab === 'knowledge' && activeBot && (
              <KnowledgeBaseView bot={activeBot} />
            )}

            {currentTab === 'inbox' && (
              <InboxView bots={bots} />
            )}

            {currentTab === 'actions' && (
              <ActionsView bots={bots} />
            )}

            {currentTab === 'appearance' && activeBot && (
              <AppearanceView bot={activeBot} onUpdateBot={handleUpdateBot} />
            )}

            {currentTab === 'deployment' && activeBot && (
              <DeploymentView bot={activeBot} onUpdateBot={handleUpdateBot} />
            )}

            {currentTab === 'analytics' && (
              <AnalyticsView analytics={analytics} bots={bots} />
            )}
          </>
        )}
      </main>

      {/* Guided Chatbot Creation Wizard Modal */}
      <CreateBotModal
        isOpen={isCreateModalOpen}
        workspaceId={currentWorkspace?.id || 'ws_default_1'}
        onClose={() => setIsCreateModalOpen(false)}
        onBotCreated={handleBotCreated}
      />
    </div>
  );
}
