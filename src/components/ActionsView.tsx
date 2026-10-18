import React, { useState, useEffect } from 'react';
import { ActionSubmission, ChatbotConfig } from '../types';
import { api } from '../services/api';
import {
  Calendar,
  CheckCircle2,
  Clock,
  User,
  Phone,
  Mail,
  FileSpreadsheet,
  Search,
  Filter,
} from 'lucide-react';

interface ActionsViewProps {
  bots: ChatbotConfig[];
}

export function ActionsView({ bots }: ActionsViewProps) {
  const [submissions, setSubmissions] = useState<ActionSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const data = await api.getActionSubmissions();
      setSubmissions(data || []);
    } catch (err) {
      console.warn('Notice loading action submissions:', err);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const filtered = submissions.filter((sub) => {
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchesSearch =
      searchQuery === '' ||
      sub.actionTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(sub.data).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Workflows & Action Submissions</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              {submissions.length} Submissions
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real customer booking requests, quote inquiries, and lead captures submitted through your chatbots.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1 sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search submissions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {['all', 'new', 'reviewed', 'contacted'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-3">
        {filtered.map((sub) => {
          const bot = bots.find((b) => b.id === sub.botId);
          return (
            <div
              key={sub.id}
              className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{sub.actionTitle}</span>
                  <span className="text-[10.5px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {bot?.businessName || 'Business Chatbot'}
                  </span>
                  <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-semibold">
                    ID: #{sub.id.substring(4, 9).toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(sub.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                {Object.entries(sub.data).map(([key, val]) => (
                  <div key={key}>
                    <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      {key.replace('f_', '').replace('_', ' ')}
                    </span>
                    <span className="text-slate-800 font-medium break-words">
                      {String(val) || '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && !loading && (
          <div className="p-8 bg-white rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
            No submissions found matching the criteria.
          </div>
        )}
      </div>
    </div>
  );
}
