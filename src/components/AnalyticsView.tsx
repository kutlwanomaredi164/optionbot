import React from 'react';
import { BotAnalytics, ChatbotConfig } from '../types';
import {
  TrendingUp,
  MessageSquare,
  BarChart3,
  MousePointerClick,
  Inbox,
  CheckCircle2,
  Calendar,
  Globe,
} from 'lucide-react';

interface AnalyticsViewProps {
  analytics: BotAnalytics | null;
  bots: ChatbotConfig[];
}

export function AnalyticsView({ analytics, bots }: AnalyticsViewProps) {
  const publishedCount = bots.filter((b) => b.status === 'published').length;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Analytics & Activity Monitoring</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real customer interaction figures, category selections, and handoff rates.
          </p>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Conversations</span>
            <MessageSquare className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {analytics?.totalConversations ?? 0}
          </div>
          <p className="text-[11px] text-slate-400">Recorded visitor sessions</p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Messages</span>
            <BarChart3 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {analytics?.totalMessages ?? 0}
          </div>
          <p className="text-[11px] text-slate-400">Total inbound and bot turns</p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Human Handoff Requests</span>
            <Inbox className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {analytics?.totalHandoffRequests ?? 0}
          </div>
          <p className="text-[11px] text-slate-400">
            {analytics?.unresolvedHandoffRequests ?? 0} currently unresolved
          </p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Form / Action Submissions</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {analytics?.totalActionSubmissions ?? 0}
          </div>
          <p className="text-[11px] text-slate-400">Bookings, quotes, and leads</p>
        </div>
      </div>

      {/* 2-Column Split: Most Selected Categories vs Trend Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Selected Categories Card */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <MousePointerClick className="w-4 h-4 text-indigo-600" />
              Most Selected Main Menu Categories
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Actual click events</span>
          </div>

          {analytics?.topMenuClicks && analytics.topMenuClicks.length > 0 ? (
            <div className="space-y-3 pt-2">
              {analytics.topMenuClicks.map((item, idx) => {
                const maxCount = analytics.topMenuClicks[0]?.count || 1;
                const percentage = Math.round((item.count / maxCount) * 100);
                return (
                  <div key={item.menuId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">
                        {idx + 1}. {item.title}
                      </span>
                      <span className="font-mono text-slate-500 font-medium">
                        {item.count} clicks
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">
              No menu click records found yet.
            </div>
          )}
        </div>

        {/* 7-Day Conversation Volume Chart */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              7-Day Conversation Volume
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Daily count</span>
          </div>

          {analytics?.conversationsByDay && analytics.conversationsByDay.length > 0 ? (
            <div className="pt-4 flex items-end justify-between h-44 gap-2 border-b border-slate-200 pb-2">
              {analytics.conversationsByDay.map((d, i) => {
                const max = Math.max(...analytics.conversationsByDay.map((x) => x.count), 4);
                const heightPct = Math.max((d.count / max) * 100, 10);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-[10.5px] font-mono text-slate-600 font-semibold">
                      {d.count}
                    </span>
                    <div
                      className="w-full max-w-[28px] bg-indigo-500/80 hover:bg-indigo-600 rounded-t transition-all"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[10px] text-slate-400 truncate max-w-[40px]">
                      {d.date}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">
              No historical data available.
            </div>
          )}
        </div>
      </div>

      {/* Bots Overview Table */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
          Deployment & Chatbot Health Status
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                <th className="pb-2.5">Chatbot Name</th>
                <th className="pb-2.5">Business Name</th>
                <th className="pb-2.5">Industry</th>
                <th className="pb-2.5">Conversation Style</th>
                <th className="pb-2.5">Status</th>
                <th className="pb-2.5">Deployment ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bots.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="py-2.5 font-semibold text-slate-900">{b.name}</td>
                  <td className="py-2.5 text-slate-700">{b.businessName}</td>
                  <td className="py-2.5 text-slate-500">{b.industry}</td>
                  <td className="py-2.5 uppercase font-mono text-[10.5px] text-slate-600">
                    {b.conversationStyle}
                  </td>
                  <td className="py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${
                        b.status === 'published'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="py-2.5 font-mono text-[11px] text-slate-500">
                    {b.deployment.deploymentId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
