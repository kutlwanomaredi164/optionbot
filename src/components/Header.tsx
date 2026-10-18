import React from 'react';
import { Bot, Plus, Layers, Inbox, CheckCircle2, TrendingUp, Settings, LogIn, LogOut, Database } from 'lucide-react';
import { Workspace } from '../types';
import { useFirebaseAuth } from '../context/FirebaseAuthContext';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenCreateBotModal: () => void;
  workspaces: Workspace[];
  currentWorkspace?: Workspace;
  unresolvedCount: number;
}

export function Header({
  currentTab,
  onSelectTab,
  onOpenCreateBotModal,
  workspaces,
  currentWorkspace,
  unresolvedCount,
}: HeaderProps) {
  const { user, loading: authLoading, firestoreConnected, signInWithGoogle, signOut } = useFirebaseAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-8 shrink-0 sticky top-0 z-40">
      {/* Zone 1: Single Text Element Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('dashboard');
          }}
          className="text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-base shadow-xs">
            S
          </div>
          <span>SelectBot</span>
        </a>

        {/* Firebase indicator badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-[11px] font-medium text-slate-600 border border-slate-200" title="Firebase Firestore & Auth Active">
          <Database className="w-3 h-3 text-amber-500" />
          <span>Firestore Connected</span>
        </div>
      </div>

      {/* Zone 2: Clean 1-Line Text Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentTab === 'dashboard' ? 'text-indigo-600 font-semibold' : ''
          }`}
        >
          Dashboard
        </button>

        <button
          onClick={() => onSelectTab('builder')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentTab === 'builder' ? 'text-indigo-600 font-semibold' : ''
          }`}
        >
          Conversation Builder
        </button>

        <button
          onClick={() => onSelectTab('inbox')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
            currentTab === 'inbox' ? 'text-indigo-600 font-semibold' : ''
          }`}
        >
          <span>Inbox</span>
          {unresolvedCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unresolvedCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectTab('actions')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentTab === 'actions' ? 'text-indigo-600 font-semibold' : ''
          }`}
        >
          Actions
        </button>

        <button
          onClick={() => onSelectTab('knowledge')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentTab === 'knowledge' ? 'text-indigo-600 font-semibold' : ''
          }`}
        >
          Knowledge
        </button>

        <button
          onClick={() => onSelectTab('appearance')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentTab === 'appearance' ? 'text-indigo-600 font-semibold' : ''
          }`}
        >
          Appearance
        </button>

        <button
          onClick={() => onSelectTab('deployment')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentTab === 'deployment' ? 'text-indigo-600 font-semibold' : ''
          }`}
        >
          Deployment
        </button>

        <button
          onClick={() => onSelectTab('analytics')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentTab === 'analytics' ? 'text-indigo-600 font-semibold' : ''
          }`}
        >
          Analytics
        </button>
      </nav>

      {/* Zone 3: Actions & Firebase Auth Profile */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenCreateBotModal}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Chatbot</span>
        </button>

        {/* User Auth Info */}
        {!authLoading && (
          user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 rounded-full border border-slate-300 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-200">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs font-medium text-slate-800 leading-tight">
                  {user.displayName || 'User'}
                </span>
                <span className="text-[10px] text-slate-500 leading-tight truncate max-w-[110px]">
                  {user.email}
                </span>
              </div>
              <button
                onClick={signOut}
                title="Sign out of Firebase"
                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Sign in with Google Account"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Sign in with Google</span>
              <span className="sm:hidden">Sign in</span>
            </button>
          )
        )}
      </div>
    </header>
  );
}
