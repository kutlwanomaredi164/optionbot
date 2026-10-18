import React, { useState, useEffect } from 'react';
import { HumanAssistanceRequest, ChatbotConfig } from '../types';
import { api } from '../services/api';
import {
  Inbox,
  User,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Filter,
  Check,
  Search,
  ExternalLink,
} from 'lucide-react';

interface InboxViewProps {
  bots: ChatbotConfig[];
}

export function InboxView({ bots }: InboxViewProps) {
  const [requests, setRequests] = useState<HumanAssistanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [agentNotes, setAgentNotes] = useState('');
  const [updatingNotes, setUpdatingNotes] = useState(false);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await api.getInboxRequests();
      setRequests(data);
      if (data.length > 0 && !selectedRequestId) {
        setSelectedRequestId(data[0].id);
        setAgentNotes(data[0].agentNotes || '');
      }
    } catch (err) {
      console.error('Failed to load inbox requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const selectedRequest = requests.find((r) => r.id === selectedRequestId);
  const targetBot = bots.find((b) => b.id === selectedRequest?.botId);

  useEffect(() => {
    if (selectedRequest) {
      setAgentNotes(selectedRequest.agentNotes || '');
    }
  }, [selectedRequestId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedRequest) return;
    try {
      const updated = await api.updateInboxRequest(selectedRequest.id, {
        status: newStatus,
      });
      setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedRequest) return;
    setUpdatingNotes(true);
    try {
      const updated = await api.updateInboxRequest(selectedRequest.id, {
        agentNotes,
      });
      setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (err) {
      console.error('Failed to save notes', err);
    } finally {
      setUpdatingNotes(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !replyText.trim() || sendingReply) return;

    setSendingReply(true);
    try {
      await api.sendAgentReply(selectedRequest.id, replyText.trim());
      setReplyText('');
      await loadRequests();
    } catch (err) {
      console.error('Failed to send reply', err);
      alert('Could not deliver agent reply');
    } finally {
      setSendingReply(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-rose-100 text-rose-800">New</span>;
      case 'awaiting_response':
        return <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-amber-100 text-amber-800">Awaiting Response</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-blue-100 text-blue-800">In Progress</span>;
      case 'resolved':
        return <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-100 text-emerald-800">Resolved</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 h-[calc(100vh-80px)] flex flex-col">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Conversation Inbox & Human Handoff</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              {requests.length} Total Requests
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real customer enquiries and human takeover requests routed from your chatbots.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          {['all', 'new', 'awaiting_response', 'in_progress', 'resolved'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors capitalize cursor-pointer ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split: Requests List vs Conversation View */}
      <div className="flex-1 flex overflow-hidden pt-4 gap-4">
        {/* Left Column: Request Cards (Width: 360px) */}
        <div className="w-88 bg-white rounded-xl border border-slate-200 flex flex-col shrink-0 overflow-hidden shadow-xs">
          <div className="p-3 border-b border-slate-200 bg-slate-50/60 text-xs font-bold text-slate-700 uppercase tracking-wide">
            Customer Requests ({filteredRequests.length})
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredRequests.map((req) => {
              const isSelected = req.id === selectedRequestId;
              const bot = bots.find((b) => b.id === req.botId);
              return (
                <div
                  key={req.id}
                  onClick={() => setSelectedRequestId(req.id)}
                  className={`p-3.5 text-left cursor-pointer transition-all space-y-1.5 ${
                    isSelected ? 'bg-indigo-50/70 border-l-3 border-indigo-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {req.customerName || 'Anonymous Visitor'}
                    </span>
                    {getStatusBadge(req.status)}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {req.message}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                    <span className="truncate max-w-[140px]">{bot?.businessName || 'Chatbot'}</span>
                    <span>
                      {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredRequests.length === 0 && !loading && (
              <div className="p-8 text-center text-xs text-slate-500">
                No requests found in this queue.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation & Reply Pane */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden shadow-xs">
          {selectedRequest ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Request Details Header */}
              <div className="p-4 border-b border-slate-200 flex items-start justify-between bg-slate-50/60 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">
                      {selectedRequest.customerName}
                    </h2>
                    {getStatusBadge(selectedRequest.status)}
                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Delivered to Inbox
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 font-mono">
                    <span>Contact: {selectedRequest.customerContact}</span>
                    <span>·</span>
                    <span>Bot: {targetBot?.businessName || 'General Assistant'}</span>
                    <span>·</span>
                    <span>Received: {new Date(selectedRequest.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* Status Selector */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-600">Update Status:</label>
                  <select
                    value={selectedRequest.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="px-2.5 py-1 text-xs rounded border border-slate-300 bg-white font-medium text-slate-800"
                  >
                    <option value="new">New</option>
                    <option value="awaiting_response">Awaiting Response</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>

              {/* Message Context & Excerpt */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-1.5">
                  <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wide">
                    Customer Message
                  </span>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    "{selectedRequest.message}"
                  </p>
                </div>

                {selectedRequest.historyExcerpt && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                      Conversation Context Preceding Request
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed font-mono whitespace-pre-wrap">
                      {selectedRequest.historyExcerpt}
                    </p>
                  </div>
                )}

                {/* Internal Agent Notes */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                    Internal Staff Notes
                  </span>
                  <textarea
                    rows={2}
                    value={agentNotes}
                    onChange={(e) => setAgentNotes(e.target.value)}
                    placeholder="Add private staff notes or follow-up details..."
                    className="w-full px-3 py-1.5 text-xs bg-white rounded border border-slate-300"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveNotes}
                      disabled={updatingNotes}
                      className="px-3 py-1 bg-slate-800 text-white text-[11px] font-semibold rounded hover:bg-slate-900 cursor-pointer"
                    >
                      {updatingNotes ? 'Saving...' : 'Save Notes'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Agent Reply Box (Live delivery to customer conversation) */}
              <div className="p-4 border-t border-slate-200 bg-white shrink-0 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-indigo-600" />
                    Send Live Agent Reply to Customer
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Appears immediately in customer chat session
                  </span>
                </div>

                <form onSubmit={handleSendReply} className="flex gap-2">
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your response to the customer..."
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer self-end shrink-0"
                  >
                    {sendingReply ? 'Sending...' : 'Send Reply'}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-xs text-slate-500">
              Select a customer request from the left column to view details and send a reply.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
