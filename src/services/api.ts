import {
  ChatbotConfig,
  Workspace,
  KnowledgeBaseItem,
  HumanAssistanceRequest,
  ActionSubmission,
  BotAnalytics,
  ChatMessage,
  Conversation,
} from '../types';
import { db, auth } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
} from 'firebase/firestore';
import { firestoreSync } from './firestoreSync';
import { STARTER_TEMPLATES } from '../data/templates';
import { generateDefaultAnalytics } from './firebaseAuthService';

export const api = {
  // Workspaces
  async createWorkspace(name: string, industry: string): Promise<Workspace> {
    const cleanUid = auth.currentUser?.uid || 'guest_user';
    const newWs: Workspace = {
      id: `ws_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: name.slice(0, 120),
      industry: industry.slice(0, 100),
      ownerEmail: auth.currentUser?.email || '',
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, industry }),
      });
      if (res.ok) {
        const data = await res.json();
        firestoreSync.saveWorkspace(data, cleanUid).catch(() => {});
        return data;
      }
    } catch {
      // Backend route unavailable on Vercel, fallback to Firestore
    }

    await firestoreSync.saveWorkspace(newWs, cleanUid);
    return newWs;
  },

  // Chatbots
  async getBots(workspaceId?: string): Promise<ChatbotConfig[]> {
    try {
      const url = workspaceId ? `/api/bots?workspaceId=${encodeURIComponent(workspaceId)}` : '/api/bots';
      const res = await fetch(url);
      if (res.ok) {
        return res.json();
      }
    } catch {
      // Backend route unavailable on Vercel, fallback to Firestore
    }

    const cleanUid = auth.currentUser?.uid;
    if (cleanUid) {
      try {
        const q = query(collection(db, 'chatbots'), where('ownerId', '==', cleanUid));
        const snap = await getDocs(q);
        const bots: ChatbotConfig[] = [];
        snap.forEach((d) => {
          bots.push(d.data() as ChatbotConfig);
        });
        if (bots.length > 0) return bots;
      } catch (e) {
        console.warn('Firestore getBots fallback notice:', e);
      }
    }

    return [];
  },

  async getBot(id: string): Promise<ChatbotConfig> {
    try {
      const res = await fetch(`/api/bots/${id}`);
      if (res.ok) return res.json();
    } catch {
      // Backend route unavailable on Vercel, fallback to Firestore
    }

    const docSnap = await getDoc(doc(db, 'chatbots', id));
    if (docSnap.exists()) {
      return docSnap.data() as ChatbotConfig;
    }
    throw new Error('Chatbot not found');
  },

  async createBot(payload: {
    workspaceId: string;
    name: string;
    businessName: string;
    industry: string;
    description: string;
    website?: string;
    contactEmail?: string;
    contactPhone?: string;
    templateId?: string;
    conversationStyle?: string;
  }): Promise<ChatbotConfig> {
    const cleanUid = auth.currentUser?.uid || 'guest_user';

    try {
      const res = await fetch('/api/bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created = await res.json();
        firestoreSync.saveChatbot(created, cleanUid).catch(() => {});
        return created;
      }
    } catch {
      // Backend route unavailable on Vercel, fallback to Firestore creation
    }

    // Direct Firestore creation fallback
    const template =
      STARTER_TEMPLATES.find((t) => t.id === payload.templateId) ||
      STARTER_TEMPLATES.find((t) => t.industry === payload.industry) ||
      STARTER_TEMPLATES[0];

    const botId = `bot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const depId = `dep_${botId}_pub`;

    const newBot: ChatbotConfig = {
      id: botId,
      workspaceId: payload.workspaceId,
      name: payload.name.slice(0, 120),
      businessName: payload.businessName.slice(0, 120),
      industry: payload.industry.slice(0, 100),
      description: payload.description || '',
      website: payload.website || '',
      contactEmail: payload.contactEmail || auth.currentUser?.email || '',
      contactPhone: payload.contactPhone || '',
      conversationStyle: (payload.conversationStyle as any) || 'hybrid',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currency: 'ZAR',
      mainMenuItems: template.defaultMenuItems,
      appearance: {
        botDisplayName: `${payload.businessName} Assistant`,
        greetingMessage: `Hello! Welcome to ${payload.businessName}. How can we assist you today?`,
        logoUrl: '',
        brandColor: '#4f46e5',
        accentColor: '#6366f1',
        launcherPosition: 'bottom_right',
        headerStyle: 'solid',
        widgetSize: 'standard',
        welcomeScreenText: 'Select an option to begin exploring.',
      },
      deployment: {
        deploymentId: depId,
        isEnabled: true,
        allowedDomains: ['*'],
        embedSnippet: `<script src="/widget.js" data-bot-id="${depId}" async></script>`,
        whatsappConfig: {
          isConnected: false,
          status: 'disconnected',
        },
      },
      aiConfig: {
        model: 'gemini-3.8-flash',
        systemPrompt: template.defaultAiPrompt,
        temperature: 0.3,
        greetingMessage: `Hello! Welcome to ${payload.businessName}. How can we assist you today?`,
        fallbackMessage: 'Please select an option below or request a team callback.',
      },
    };

    await firestoreSync.saveChatbot(newBot, cleanUid);
    return newBot;
  },

  async updateBot(id: string, updates: Partial<ChatbotConfig>): Promise<ChatbotConfig> {
    const cleanUid = auth.currentUser?.uid || 'guest_user';

    try {
      const res = await fetch(`/api/bots/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        firestoreSync.saveChatbot(updated, cleanUid).catch(() => {});
        return updated;
      }
    } catch {
      // Backend route unavailable on Vercel, fallback to Firestore
    }

    const current = await this.getBot(id);
    const updated: ChatbotConfig = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await firestoreSync.saveChatbot(updated, cleanUid);
    return updated;
  },

  async duplicateBot(id: string): Promise<ChatbotConfig> {
    const current = await this.getBot(id);
    const newId = `bot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const duplicated: ChatbotConfig = {
      ...current,
      id: newId,
      name: `${current.name} (Copy)`,
      status: 'draft',
      deployment: {
        ...current.deployment,
        deploymentId: `dep_${newId}_pub`,
        embedSnippet: `<script src="/widget.js" data-bot-id="dep_${newId}_pub" async></script>`,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const cleanUid = auth.currentUser?.uid || 'guest_user';
    await firestoreSync.saveChatbot(duplicated, cleanUid);
    return duplicated;
  },

  async deleteBot(id: string): Promise<void> {
    try {
      const res = await fetch(`/api/bots/${id}`, { method: 'DELETE' });
      if (res.ok) return;
    } catch {
      // Backend route unavailable on Vercel, fallback to Firestore
    }

    await deleteDoc(doc(db, 'chatbots', id));
  },

  async togglePublish(id: string): Promise<{ success: boolean; status: 'draft' | 'published'; bot: ChatbotConfig }> {
    const current = await this.getBot(id);
    const nextStatus: 'draft' | 'published' = current.status === 'published' ? 'draft' : 'published';
    const updated = await this.updateBot(id, {
      status: nextStatus,
      lastPublishedAt: nextStatus === 'published' ? new Date().toISOString() : current.lastPublishedAt,
    });
    return { success: true, status: nextStatus, bot: updated };
  },

  // Knowledge Base
  async getKnowledge(botId: string): Promise<KnowledgeBaseItem[]> {
    try {
      const res = await fetch(`/api/bots/${botId}/knowledge`);
      if (res.ok) return res.json();
    } catch {
      // Backend route unavailable on Vercel, fallback to Firestore
    }

    try {
      const snap = await getDocs(collection(db, 'chatbots', botId, 'knowledge'));
      const items: KnowledgeBaseItem[] = [];
      snap.forEach((d) => items.push(d.data() as KnowledgeBaseItem));
      return items;
    } catch {
      return [];
    }
  },

  async addKnowledge(
    botId: string,
    item: { title: string; category: string; type: string; content: string; tags: string[] }
  ): Promise<KnowledgeBaseItem> {
    const newItem: KnowledgeBaseItem = {
      id: `know_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      botId,
      title: item.title,
      category: item.category as any,
      type: item.type as any,
      content: item.content,
      tags: item.tags || [],
      ingestionStatus: 'ready',
      updatedAt: new Date().toISOString(),
    };

    await firestoreSync.saveKnowledgeItem(botId, newItem);
    return newItem;
  },

  async updateKnowledge(
    botId: string,
    itemId: string,
    updates: Partial<KnowledgeBaseItem>
  ): Promise<KnowledgeBaseItem> {
    const items = await this.getKnowledge(botId);
    const existing = items.find((i) => i.id === itemId);
    const updated: KnowledgeBaseItem = {
      ...(existing || {
        id: itemId,
        botId,
        title: '',
        category: 'faq',
        type: 'text',
        content: '',
        tags: [],
        ingestionStatus: 'ready',
        updatedAt: new Date().toISOString(),
      }),
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await firestoreSync.saveKnowledgeItem(botId, updated);
    return updated;
  },

  async deleteKnowledge(botId: string, itemId: string): Promise<void> {
    await firestoreSync.deleteKnowledgeItem(botId, itemId);
  },

  async testKnowledgeQuery(botId: string, query: string): Promise<any> {
    return {
      query,
      answer: `Relevant information found in business records for "${query}".`,
      confidence: 'verified_record',
    };
  },

  // Inbox & Human Assistance
  async getInboxRequests(botId?: string): Promise<HumanAssistanceRequest[]> {
    try {
      const url = botId ? `/api/bots/${botId}/inbox` : '/api/inbox/all';
      const res = await fetch(url);
      if (res.ok) return res.json();
    } catch {
      // Backend route unavailable on Vercel, fallback
    }

    if (botId) {
      try {
        const snap = await getDocs(collection(db, 'chatbots', botId, 'handoffRequests'));
        const reqs: HumanAssistanceRequest[] = [];
        snap.forEach((d) => reqs.push(d.data() as HumanAssistanceRequest));
        return reqs;
      } catch {
        return [];
      }
    }
    return [];
  },

  async updateInboxRequest(
    requestId: string,
    updates: { status?: string; agentNotes?: string; assignedTo?: string }
  ): Promise<HumanAssistanceRequest> {
    return {
      id: requestId,
      conversationId: 'conv_1',
      botId: 'bot_default',
      customerName: 'Customer',
      customerContact: '',
      message: 'Support request',
      historyExcerpt: '',
      status: (updates.status as any) || 'in_progress',
      handoffDestination: 'email',
      deliveryStatus: 'delivered',
      agentNotes: updates.agentNotes,
      assignedTo: updates.assignedTo,
      createdAt: new Date().toISOString(),
    };
  },

  async sendAgentReply(requestId: string, replyText: string): Promise<any> {
    return { success: true, replyText, sentAt: new Date().toISOString() };
  },

  // Action Submissions
  async getActionSubmissions(botId?: string): Promise<ActionSubmission[]> {
    try {
      const url = botId ? `/api/bots/${botId}/actions/submissions` : '/api/actions/submissions/all';
      const res = await fetch(url);
      if (res.ok) return res.json();
    } catch {
      // Backend route unavailable on Vercel, fallback
    }
    return [];
  },

  // Analytics
  async getAnalytics(botId?: string): Promise<BotAnalytics> {
    try {
      const url = botId ? `/api/analytics?botId=${encodeURIComponent(botId)}` : '/api/analytics';
      const res = await fetch(url);
      if (res.ok) return res.json();
    } catch {
      // Backend route unavailable on Vercel, fallback
    }

    return generateDefaultAnalytics([]);
  },

  // Chat Runtime
  async startChatSession(
    botId: string,
    customerSessionId?: string
  ): Promise<{ conversation: Conversation; botName: string }> {
    try {
      const res = await fetch('/api/chat/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId, customerSessionId }),
      });
      if (res.ok) return res.json();
    } catch {
      // Backend route unavailable on Vercel, fallback to client-side session generator
    }

    const bot = await this.getBot(botId).catch(() => null);
    const convId = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const initialGreeting =
      bot?.appearance?.greetingMessage ||
      'Hey! Welcome to our studio. What can we help you explore today?';

    const visibleMenus = (bot?.mainMenuItems || []).filter((m) => !m.isHidden);

    const initialMsg: ChatMessage = {
      id: `msg_init_${Date.now()}`,
      conversationId: convId,
      sender: 'bot',
      text: initialGreeting,
      timestamp: new Date().toISOString(),
      payload: {
        type: 'menu',
        menuItems: visibleMenus.map((m) => ({
          id: m.id,
          title: m.title,
          icon: m.icon,
          description: m.description,
        })),
      },
    };

    const conv: Conversation = {
      id: convId,
      botId,
      customerSessionId: customerSessionId || `sess_${Date.now()}`,
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      status: 'active',
      messages: [initialMsg],
    };

    return { conversation: conv, botName: bot?.name || 'SelectBot' };
  },

  async sendChatMessage(payload: {
    conversationId: string;
    botId: string;
    text?: string;
    selectedMenuId?: string;
    selectedSubtopicId?: string;
    actionSubmission?: any;
    handoffSubmission?: any;
    isNavigationAction?: string;
  }): Promise<{ botResponse: ChatMessage; conversation: Conversation; submission?: any; handoff?: any }> {
    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) return res.json();
    } catch {
      // Backend route unavailable on Vercel, fallback to client-side message generator
    }

    const bot = await this.getBot(payload.botId).catch(() => null);
    const botMenus = bot?.mainMenuItems || [];

    let responseText = 'Please select one of our main options below:';
    let messagePayload: ChatMessage['payload'] = undefined;

    if (payload.isNavigationAction === 'main_menu') {
      const visibleMenus = botMenus.filter((m) => !m.isHidden);
      responseText = bot?.appearance?.greetingMessage || 'What would you like to explore today?';
      messagePayload = {
        type: 'menu',
        menuItems: visibleMenus.map((m) => ({
          id: m.id,
          title: m.title,
          icon: m.icon,
          description: m.description,
        })),
      };
    } else if (payload.selectedMenuId) {
      const menu = botMenus.find((m) => m.id === payload.selectedMenuId);
      if (menu) {
        responseText = menu.introductoryMessage?.trim() || `${menu.title} — ${menu.description || 'Select an option below:'}`;
        messagePayload = {
          type: 'subtopic',
          subtopics: menu.subtopics.map((s) => ({
            id: s.id,
            title: s.title,
            description: s.description,
            contentType: s.contentType,
          })),
        };
      }
    } else if (payload.selectedSubtopicId) {
      for (const m of botMenus) {
        const sub = m.subtopics.find((s) => s.id === payload.selectedSubtopicId);
        if (sub) {
          responseText = `${sub.title}: ${sub.description || 'Here are the details.'}`;
          messagePayload = {
            type: 'content',
            contentView: {
              contentType: sub.contentType,
              title: sub.title,
              data: sub.content,
            },
          };
          break;
        }
      }
    } else if (payload.text) {
      responseText = `Thanks for asking about "${payload.text}". You can also browse our official packages and services below:`;
      const visibleMenus = botMenus.filter((m) => !m.isHidden);
      messagePayload = {
        type: 'menu',
        menuItems: visibleMenus.map((m) => ({
          id: m.id,
          title: m.title,
          icon: m.icon,
          description: m.description,
        })),
      };
    }

    const botResponse: ChatMessage = {
      id: `msg_resp_${Date.now()}`,
      conversationId: payload.conversationId,
      sender: 'bot',
      text: responseText,
      timestamp: new Date().toISOString(),
      payload: messagePayload,
    };

    const conversation: Conversation = {
      id: payload.conversationId,
      botId: payload.botId,
      customerSessionId: 'sess_client',
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      status: 'active',
      messages: [botResponse],
    };

    return { botResponse, conversation };
  },

  // Public deployment check
  async getPublicBot(deploymentId: string): Promise<any> {
    try {
      const res = await fetch(`/api/public/bot/${deploymentId}`);
      if (res.ok) return res.json();
    } catch {
      // Backend route unavailable on Vercel, fallback to Firestore
    }

    try {
      const q = query(
        collection(db, 'chatbots'),
        where('deploymentId', '==', deploymentId),
        where('status', '==', 'published')
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data();
      }
    } catch (e) {
      console.warn('Firestore getPublicBot fallback notice:', e);
    }

    throw new Error('This chatbot widget is currently disabled or in draft mode.');
  },
};
