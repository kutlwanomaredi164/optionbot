import React, { useState, useEffect } from 'react';
import { ChatbotConfig, KnowledgeBaseItem } from '../types';
import { api } from '../services/api';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Search,
  Check,
  AlertCircle,
  Sparkles,
  Tag,
  ArrowRight,
  Filter,
  FileText,
  HelpCircle,
  Link as LinkIcon,
  CheckCircle2,
} from 'lucide-react';

interface KnowledgeBaseViewProps {
  bot: ChatbotConfig;
}

export function KnowledgeBaseView({ bot }: KnowledgeBaseViewProps) {
  const [items, setItems] = useState<KnowledgeBaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Editor Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeBaseItem | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'faq' | 'service' | 'policy' | 'general' | 'pricing' | 'hours'>('faq');
  const [type, setType] = useState<'text' | 'faq' | 'service' | 'policy' | 'document' | 'link'>('faq');
  const [content, setContent] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // AI Retrieval Simulator State
  const [testQuery, setTestQuery] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [testingQuery, setTestingQuery] = useState(false);

  const loadKnowledge = async () => {
    try {
      setLoading(true);
      const data = await api.getKnowledge(bot.id);
      setItems(data);
    } catch (err) {
      console.error('Failed to load knowledge', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKnowledge();
  }, [bot.id]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setTitle('');
    setCategory('faq');
    setType('faq');
    setContent('');
    setTagsStr('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: KnowledgeBaseItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setCategory(item.category);
    setType(item.type);
    setContent(item.content);
    setTagsStr(item.tags.join(', '));
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    const tags = tagsStr
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    try {
      if (editingItem) {
        const updated = await api.updateKnowledge(bot.id, editingItem.id, {
          title: title.trim(),
          category,
          type,
          content: content.trim(),
          tags,
        });
        setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
      } else {
        const created = await api.addKnowledge(bot.id, {
          title: title.trim(),
          category,
          type,
          content: content.trim(),
          tags,
        });
        setItems((prev) => [created, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save knowledge item', err);
      alert('Failed to save item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Delete this verified knowledge item?')) return;
    try {
      await api.deleteKnowledge(bot.id, id);
      setItems((prev) => prev.filter((it) => it.id !== id));
    } catch (err) {
      console.error('Failed to delete item', err);
    }
  };

  const handleTestQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testQuery.trim()) return;
    setTestingQuery(true);
    try {
      const res = await api.testKnowledgeQuery(bot.id, testQuery.trim());
      setTestResult(res);
    } catch (err) {
      console.error('Test query failed', err);
    } finally {
      setTestingQuery(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesCat = filterCategory === 'all' || item.category === filterCategory;
    const matchesSearch =
      searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Knowledge Base & AI Retrieval</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              {bot.name}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Verified business facts, policies, and FAQs cited by the AI conversation engine.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" /> Add Knowledge Item
        </button>
      </div>

      {/* Simulator: Test Retrieval Matching */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Test AI Retrieval Simulator
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Verify which documents Gemini retrieves for a given question
          </span>
        </div>

        <form onSubmit={handleTestQuery} className="flex gap-2">
          <input
            type="text"
            placeholder="Type a visitor question to test retrieval (e.g. 'What is your deposit policy?' or 'What do I wear?')"
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={testingQuery || !testQuery.trim()}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
          >
            {testingQuery ? 'Retrieving...' : 'Test Match'}
          </button>
        </form>

        {testResult && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 font-medium">
              <span>Matches Found: {testResult.matchesCount} of {testResult.totalDocuments} total documents</span>
              <button
                onClick={() => setTestResult(null)}
                className="text-[11px] text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            </div>
            {testResult.matches.length > 0 ? (
              <div className="space-y-1.5">
                {testResult.matches.map((m: any, i: number) => (
                  <div key={m.id} className="p-2 bg-white rounded border border-slate-200 flex items-start gap-2">
                    <span className="font-mono text-[10px] text-indigo-600 font-bold mt-0.5">#{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-900">{m.title}</div>
                      <p className="text-[11.5px] text-slate-600 mt-0.5 line-clamp-2">{m.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 italic">
                No matching documents. The assistant will fall back to general menu navigation or polite handoff.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search documents or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['all', 'faq', 'service', 'policy', 'pricing', 'hours', 'general'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors cursor-pointer ${
                filterCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Document Items List */}
      <div className="space-y-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all space-y-2 shadow-xs"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">{item.title}</span>
                <span className="text-[10.5px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {item.category}
                </span>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Indexed
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  title="Edit item"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                  title="Delete item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
              {item.content}
            </p>

            {item.tags?.length > 0 && (
              <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-400 font-mono">
                <Tag className="w-3 h-3 text-slate-400" />
                <span>{item.tags.join(' · ')}</span>
              </div>
            )}
          </div>
        ))}

        {filteredItems.length === 0 && !loading && (
          <div className="p-8 bg-white rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
            No knowledge entries found matching the current filters.
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              {editingItem ? 'Edit Knowledge Item' : 'Add New Knowledge Source'}
            </h3>

            <form onSubmit={handleSaveItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Title / Headline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deposit & Rescheduling Rules"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="faq">FAQ</option>
                    <option value="service">Service / Pricing</option>
                    <option value="policy">Policy</option>
                    <option value="hours">Hours / Location</option>
                    <option value="general">General Info</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Format Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="faq">FAQ Pair</option>
                    <option value="text">Document Text</option>
                    <option value="policy">Legal Policy</option>
                    <option value="link">Approved Link</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Content / Approved Text
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="The factual text provided here is strictly respected and cited by the AI assistant..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Search Keywords / Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. refund, cancellation, deposit, booking"
                  value={tagsStr}
                  onChange={(e) => setTagsStr(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Knowledge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
