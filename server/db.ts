import fs from 'fs';
import path from 'path';
import {
  ChatbotConfig,
  Workspace,
  UserAccount,
  KnowledgeBaseItem,
  Conversation,
  HumanAssistanceRequest,
  ActionSubmission,
  BotAnalytics,
} from '../src/types';
import { STARTER_TEMPLATES } from '../src/data/templates';

export interface DatabaseSchema {
  workspaces: Workspace[];
  users: UserAccount[];
  chatbots: ChatbotConfig[];
  knowledge: KnowledgeBaseItem[];
  conversations: Conversation[];
  handoffRequests: HumanAssistanceRequest[];
  actionSubmissions: ActionSubmission[];
  menuClickCounts: Record<string, Record<string, number>>; // botId -> { menuId: count }
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function initializeDefaultData(): DatabaseSchema {
  const defaultWorkspaceId = 'ws_default_1';
  const defaultUser: UserAccount = {
    id: 'user_1',
    name: 'Alex Morgan',
    email: 'kutlee36@gmail.com',
    role: 'owner',
    currentWorkspaceId: defaultWorkspaceId,
  };

  const defaultWorkspace: Workspace = {
    id: defaultWorkspaceId,
    name: 'Lumière Creative Works',
    industry: 'Photography Studio',
    ownerEmail: 'kutlee36@gmail.com',
    createdAt: new Date().toISOString(),
  };

  // Build default bot from photography template
  const photoTemplate = STARTER_TEMPLATES[0];
  const photoBot: ChatbotConfig = {
    id: 'bot_photo_101',
    workspaceId: defaultWorkspaceId,
    name: 'Lens & Light Studio Bot',
    businessName: 'Lens & Light Photography',
    industry: 'Photography Studio',
    description: 'Boutique portrait and wedding photography studio based in London and the Cotswolds.',
    website: 'https://lensandlight.co.uk',
    contactEmail: 'hello@lensandlight.co.uk',
    contactPhone: '+44 20 7946 0912',
    conversationStyle: 'hybrid',
    status: 'published',
    lastPublishedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date().toISOString(),
    currency: 'ZAR',
    mainMenuItems: photoTemplate.defaultMenuItems,
    appearance: {
      botDisplayName: 'Lens & Light Assistant',
      greetingMessage: 'Hey! Welcome to Lens & Light Photography. How can we help you today?',
      logoUrl: '',
      brandColor: '#4f46e5',
      accentColor: '#6366f1',
      launcherPosition: 'bottom_right',
      headerStyle: 'solid',
      widgetSize: 'standard',
      welcomeScreenText: 'Select a service below or type your question for instant answers.',
    },
    deployment: {
      deploymentId: 'dep_lens_light_pub',
      isEnabled: true,
      allowedDomains: ['*', 'https://appmedia-u7olse9b0-wan0.vercel.app', 'appmedia-u7olse9b0-wan0.vercel.app'],
      embedSnippet: '<script src="/widget.js" data-bot-id="dep_lens_light_pub" async></script>',
      whatsappConfig: {
        isConnected: false,
        status: 'disconnected',
      },
    },
    aiConfig: {
      model: 'gemini-3.8-flash',
      systemPrompt: photoTemplate.defaultAiPrompt,
      temperature: 0.3,
      greetingMessage: 'Hey! Welcome to Lens & Light Photography. How can we help you today?',
      fallbackMessage: "I'd love to help you with that! For special requests, you can choose 'Talk to a Person' or pick from our services below.",
    },
  };

  // Build secondary bot from restaurant template to verify multi-bot separation
  const restaurantTemplate = STARTER_TEMPLATES[1];
  const restaurantBot: ChatbotConfig = {
    id: 'bot_bistro_102',
    workspaceId: defaultWorkspaceId,
    name: 'Bella Vista Trattoria Bot',
    businessName: 'Bella Vista Trattoria',
    industry: 'Restaurant & Hospitality',
    description: 'Artisanal regional Italian cuisine, handmade pastas, and curated natural wines.',
    website: 'https://bellavistatrattoria.com',
    contactEmail: 'reservations@bellavistatrattoria.com',
    contactPhone: '+1 (555) 019-8472',
    conversationStyle: 'hybrid',
    status: 'published',
    lastPublishedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    updatedAt: new Date().toISOString(),
    currency: 'ZAR',
    mainMenuItems: restaurantTemplate.defaultMenuItems,
    appearance: {
      botDisplayName: 'Bella Vista Host',
      greetingMessage: 'Benvenuti! Welcome to Bella Vista Trattoria. What would you like to explore today?',
      logoUrl: '',
      brandColor: '#0f766e',
      accentColor: '#14b8a6',
      launcherPosition: 'bottom_right',
      headerStyle: 'solid',
      widgetSize: 'standard',
      welcomeScreenText: 'Reserve a table, view dinner menus, or ask about our ingredients.',
    },
    deployment: {
      deploymentId: 'dep_bella_vista_pub',
      isEnabled: true,
      allowedDomains: ['*'],
      embedSnippet: '<script src="/widget.js" data-bot-id="dep_bella_vista_pub" async></script>',
      whatsappConfig: {
        isConnected: false,
        status: 'disconnected',
      },
    },
    aiConfig: {
      model: 'gemini-3.8-flash',
      systemPrompt: restaurantTemplate.defaultAiPrompt,
      temperature: 0.2,
      greetingMessage: 'Benvenuti! Welcome to Bella Vista Trattoria. What would you like to explore today?',
      fallbackMessage: "Our host team is pleased to assist. Please select from the menu options below or request a manager callback.",
    },
  };

  // Pre-seed knowledge base
  const knowledge: KnowledgeBaseItem[] = [
    ...photoTemplate.defaultKnowledge.map((k, idx) => ({
      id: `know_photo_${idx + 1}`,
      botId: photoBot.id,
      title: k.title,
      category: k.category,
      type: k.type,
      content: k.content,
      tags: k.tags,
      ingestionStatus: 'ready' as const,
      updatedAt: new Date().toISOString(),
    })),
    ...restaurantTemplate.defaultKnowledge.map((k, idx) => ({
      id: `know_resto_${idx + 1}`,
      botId: restaurantBot.id,
      title: k.title,
      category: k.category,
      type: k.type,
      content: k.content,
      tags: k.tags,
      ingestionStatus: 'ready' as const,
      updatedAt: new Date().toISOString(),
    })),
  ];

  // Seed initial sample conversations for realism
  const sampleConvId1 = 'conv_photo_seed_1';
  const sampleConv1: Conversation = {
    id: sampleConvId1,
    botId: photoBot.id,
    customerSessionId: 'sess_client_9921',
    customerName: 'Sarah Jenkins',
    customerContact: 'sarah.j@example.com',
    startedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    lastActivityAt: new Date(Date.now() - 3600000 * 4.8).toISOString(),
    status: 'handoff_requested',
    messages: [
      {
        id: 'msg_1',
        conversationId: sampleConvId1,
        sender: 'bot',
        text: 'Hey! Welcome to Lens & Light Photography. How can we help you today?',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        id: 'msg_2',
        conversationId: sampleConvId1,
        sender: 'customer',
        text: 'Do you shoot autumn elopements in the Cotswolds?',
        timestamp: new Date(Date.now() - 3600000 * 4.9).toISOString(),
      },
      {
        id: 'msg_3',
        conversationId: sampleConvId1,
        sender: 'bot',
        text: 'Yes! We love capturing Cotswolds autumn weddings. Our Storyteller Collection covers full-day documentation, and we can also customize half-day elopement coverage.',
        timestamp: new Date(Date.now() - 3600000 * 4.89).toISOString(),
      },
      {
        id: 'msg_4',
        conversationId: sampleConvId1,
        sender: 'customer',
        text: 'Can I speak with someone about availability for October 18th?',
        timestamp: new Date(Date.now() - 3600000 * 4.85).toISOString(),
      },
      {
        id: 'msg_5',
        conversationId: sampleConvId1,
        sender: 'bot',
        text: 'Your request has been routed to our studio director. We have recorded your note and contact details.',
        timestamp: new Date(Date.now() - 3600000 * 4.8).toISOString(),
      },
    ],
  };

  const handoffRequests: HumanAssistanceRequest[] = [
    {
      id: 'handoff_req_101',
      conversationId: sampleConvId1,
      botId: photoBot.id,
      customerName: 'Sarah Jenkins',
      customerContact: 'sarah.j@example.com / +44 7700 900342',
      message: 'Looking to check date availability for a 30-guest Cotswolds autumn elopement on October 18th.',
      historyExcerpt: 'Customer asked about Cotswolds autumn elopement packages and requested date availability check.',
      status: 'awaiting_response',
      handoffDestination: 'dashboard_inbox',
      deliveryStatus: 'delivered',
      createdAt: new Date(Date.now() - 3600000 * 4.8).toISOString(),
    },
  ];

  const actionSubmissions: ActionSubmission[] = [
    {
      id: 'action_sub_1',
      actionId: 'act_table_res',
      actionType: 'booking',
      actionTitle: 'Table Reservation Request',
      botId: restaurantBot.id,
      conversationId: 'conv_resto_seed_1',
      data: {
        f_name: 'David Sterling',
        f_phone: '(555) 438-9201',
        f_date: '2026-10-24',
        f_time: '19:30',
        f_guests: '3-4 Guests',
        f_notes: 'Table near window if possible; celebrating anniversary.',
      },
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      status: 'new',
    },
  ];

  return {
    workspaces: [defaultWorkspace],
    users: [defaultUser],
    chatbots: [photoBot, restaurantBot],
    knowledge,
    conversations: [sampleConv1],
    handoffRequests,
    actionSubmissions,
    menuClickCounts: {
      [photoBot.id]: {
        menu_services: 18,
        menu_portfolio: 14,
        menu_policies: 7,
        menu_talk_to_person: 5,
      },
      [restaurantBot.id]: {
        menu_food_prices: 24,
        menu_reservations: 16,
        menu_allergies_policies: 9,
      },
    },
  };
}

export class DB {
  private static cache: DatabaseSchema | null = null;

  private static load(): DatabaseSchema {
    ensureDataDir();
    if (!fs.existsSync(DB_FILE)) {
      const initial = initializeDefaultData();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      this.cache = initial;
      return initial;
    }

    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      this.cache = JSON.parse(raw);
      return this.cache!;
    } catch (e) {
      console.error('Error reading database file, reinitializing', e);
      const fallback = initializeDefaultData();
      fs.writeFileSync(DB_FILE, JSON.stringify(fallback, null, 2), 'utf-8');
      this.cache = fallback;
      return fallback;
    }
  }

  private static save(data: DatabaseSchema): void {
    ensureDataDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    this.cache = data;
  }

  // Workspaces
  static getWorkspaces(): Workspace[] {
    return this.load().workspaces;
  }

  static getWorkspace(id: string): Workspace | undefined {
    return this.load().workspaces.find((w) => w.id === id);
  }

  static createWorkspace(name: string, industry: string, ownerEmail: string): Workspace {
    const data = this.load();
    const newWs: Workspace = {
      id: `ws_${Date.now()}`,
      name,
      industry,
      ownerEmail,
      createdAt: new Date().toISOString(),
    };
    data.workspaces.push(newWs);
    this.save(data);
    return newWs;
  }

  // Chatbots
  static getChatbots(workspaceId?: string): ChatbotConfig[] {
    const data = this.load();
    if (!workspaceId) return data.chatbots;
    return data.chatbots.filter((b) => b.workspaceId === workspaceId);
  }

  static getChatbot(id: string): ChatbotConfig | undefined {
    return this.load().chatbots.find((b) => b.id === id);
  }

  static getChatbotByDeployment(deploymentId: string): ChatbotConfig | undefined {
    return this.load().chatbots.find((b) => b.deployment?.deploymentId === deploymentId || b.id === deploymentId);
  }

  static createChatbot(bot: ChatbotConfig): ChatbotConfig {
    const data = this.load();
    data.chatbots.push(bot);
    if (!data.menuClickCounts[bot.id]) {
      data.menuClickCounts[bot.id] = {};
    }
    this.save(data);
    return bot;
  }

  static upsertChatbot(bot: ChatbotConfig): ChatbotConfig {
    const data = this.load();
    const idx = data.chatbots.findIndex((b) => b.id === bot.id || (b.deployment?.deploymentId && b.deployment.deploymentId === bot.deployment?.deploymentId));
    if (idx >= 0) {
      data.chatbots[idx] = {
        ...data.chatbots[idx],
        ...bot,
        updatedAt: new Date().toISOString(),
      };
      this.save(data);
      return data.chatbots[idx];
    } else {
      data.chatbots.push(bot);
      if (!data.menuClickCounts[bot.id]) {
        data.menuClickCounts[bot.id] = {};
      }
      this.save(data);
      return bot;
    }
  }

  static updateChatbot(id: string, updates: Partial<ChatbotConfig>): ChatbotConfig | null {
    const data = this.load();
    const idx = data.chatbots.findIndex((b) => b.id === id);
    if (idx === -1) return null;

    data.chatbots[idx] = {
      ...data.chatbots[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save(data);
    return data.chatbots[idx];
  }

  static deleteChatbot(id: string): boolean {
    const data = this.load();
    const initialLen = data.chatbots.length;
    data.chatbots = data.chatbots.filter((b) => b.id !== id);
    data.knowledge = data.knowledge.filter((k) => k.botId !== id);
    data.conversations = data.conversations.filter((c) => c.botId !== id);
    data.handoffRequests = data.handoffRequests.filter((h) => h.botId !== id);
    data.actionSubmissions = data.actionSubmissions.filter((a) => a.botId !== id);
    delete data.menuClickCounts[id];
    this.save(data);
    return data.chatbots.length < initialLen;
  }

  // Knowledge Base
  static getKnowledge(botId: string): KnowledgeBaseItem[] {
    return this.load().knowledge.filter((k) => k.botId === botId);
  }

  static addKnowledge(item: Omit<KnowledgeBaseItem, 'id' | 'updatedAt'>): KnowledgeBaseItem {
    const data = this.load();
    const newItem: KnowledgeBaseItem = {
      ...item,
      id: `know_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      updatedAt: new Date().toISOString(),
    };
    data.knowledge.push(newItem);
    this.save(data);
    return newItem;
  }

  static updateKnowledge(id: string, updates: Partial<KnowledgeBaseItem>): KnowledgeBaseItem | null {
    const data = this.load();
    const idx = data.knowledge.findIndex((k) => k.id === id);
    if (idx === -1) return null;
    data.knowledge[idx] = {
      ...data.knowledge[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save(data);
    return data.knowledge[idx];
  }

  static deleteKnowledge(id: string): boolean {
    const data = this.load();
    const initialLen = data.knowledge.length;
    data.knowledge = data.knowledge.filter((k) => k.id !== id);
    this.save(data);
    return data.knowledge.length < initialLen;
  }

  // Conversations & Messages
  static getConversations(botId?: string): Conversation[] {
    const data = this.load();
    if (!botId) return data.conversations;
    return data.conversations.filter((c) => c.botId === botId);
  }

  static getConversation(id: string): Conversation | undefined {
    return this.load().conversations.find((c) => c.id === id);
  }

  static saveConversation(conversation: Conversation): Conversation {
    const data = this.load();
    const idx = data.conversations.findIndex((c) => c.id === conversation.id);
    if (idx >= 0) {
      data.conversations[idx] = conversation;
    } else {
      data.conversations.push(conversation);
    }
    this.save(data);
    return conversation;
  }

  // Handoff / Human Assistance Requests
  static getHandoffRequests(botId?: string): HumanAssistanceRequest[] {
    const data = this.load();
    if (!botId) return data.handoffRequests;
    return data.handoffRequests.filter((h) => h.botId === botId);
  }

  static getHandoffRequest(id: string): HumanAssistanceRequest | undefined {
    return this.load().handoffRequests.find((h) => h.id === id);
  }

  static createHandoffRequest(req: Omit<HumanAssistanceRequest, 'id' | 'createdAt'>): HumanAssistanceRequest {
    const data = this.load();
    const newReq: HumanAssistanceRequest = {
      ...req,
      id: `handoff_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    data.handoffRequests.unshift(newReq);
    this.save(data);
    return newReq;
  }

  static updateHandoffRequest(id: string, updates: Partial<HumanAssistanceRequest>): HumanAssistanceRequest | null {
    const data = this.load();
    const idx = data.handoffRequests.findIndex((h) => h.id === id);
    if (idx === -1) return null;
    data.handoffRequests[idx] = {
      ...data.handoffRequests[idx],
      ...updates,
    };
    this.save(data);
    return data.handoffRequests[idx];
  }

  // Action Submissions
  static getActionSubmissions(botId?: string): ActionSubmission[] {
    const data = this.load();
    if (!botId) return data.actionSubmissions;
    return data.actionSubmissions.filter((a) => a.botId === botId);
  }

  static createActionSubmission(submission: Omit<ActionSubmission, 'id' | 'createdAt'>): ActionSubmission {
    const data = this.load();
    const newSub: ActionSubmission = {
      ...submission,
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    data.actionSubmissions.unshift(newSub);
    this.save(data);
    return newSub;
  }

  // Analytics & Menu Clicks
  static recordMenuClick(botId: string, menuId: string): void {
    const data = this.load();
    if (!data.menuClickCounts[botId]) {
      data.menuClickCounts[botId] = {};
    }
    data.menuClickCounts[botId][menuId] = (data.menuClickCounts[botId][menuId] || 0) + 1;
    this.save(data);
  }

  static getAnalytics(botId?: string): BotAnalytics {
    const data = this.load();
    const bots = botId ? data.chatbots.filter((b) => b.id === botId) : data.chatbots;
    const botIds = new Set(bots.map((b) => b.id));

    const conversations = data.conversations.filter((c) => botIds.has(c.botId));
    const handoffs = data.handoffRequests.filter((h) => botIds.has(h.botId));
    const actions = data.actionSubmissions.filter((a) => botIds.has(a.botId));

    let totalMessages = 0;
    conversations.forEach((c) => {
      totalMessages += c.messages.length;
    });

    const unresolvedHandoffs = handoffs.filter(
      (h) => h.status === 'new' || h.status === 'awaiting_response' || h.status === 'in_progress'
    ).length;

    // Aggregate menu clicks
    const menuClicksCombined: Record<string, number> = {};
    Object.entries(data.menuClickCounts).forEach(([bId, clicks]) => {
      if (botIds.has(bId)) {
        Object.entries(clicks).forEach(([mId, count]) => {
          menuClicksCombined[mId] = (menuClicksCombined[mId] || 0) + count;
        });
      }
    });

    // Lookup titles
    const menuTitles: Record<string, string> = {};
    bots.forEach((b) => {
      b.mainMenuItems.forEach((m) => {
        menuTitles[m.id] = m.title;
      });
    });

    const topMenuClicks = Object.entries(menuClicksCombined)
      .map(([menuId, count]) => ({
        menuId,
        title: menuTitles[menuId] || menuId,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Days activity
    const now = new Date();
    const conversationsByDay = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(now.getTime() - (6 - i) * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      const count = conversations.filter((c) => c.startedAt.startsWith(dateStr)).length;
      return {
        date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
        count,
      };
    });

    // Recent activity log
    const recentActivity = [
      ...handoffs.slice(0, 5).map((h) => ({
        id: `act_h_${h.id}`,
        type: 'Human Assistance',
        description: `New request from ${h.customerName || 'Visitor'}: "${h.message.substring(0, 50)}..."`,
        timestamp: h.createdAt,
      })),
      ...actions.slice(0, 5).map((a) => ({
        id: `act_a_${a.id}`,
        type: 'Action Submitted',
        description: `${a.actionTitle} received`,
        timestamp: a.createdAt,
      })),
      ...conversations.slice(0, 5).map((c) => ({
        id: `act_c_${c.id}`,
        type: 'Chat Session',
        description: `Customer session with ${c.messages.length} messages`,
        timestamp: c.lastActivityAt,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);

    return {
      totalConversations: conversations.length,
      totalMessages,
      totalHandoffRequests: handoffs.length,
      unresolvedHandoffRequests: unresolvedHandoffs,
      totalActionSubmissions: actions.length,
      topMenuClicks,
      conversationsByDay,
      recentActivity,
    };
  }
}
