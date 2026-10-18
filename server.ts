import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { DB } from './server/db.js';
import { generateAIResponse, retrieveRelevantKnowledge } from './server/ai.js';
import { ChatbotConfig, ChatMessage, Conversation, SubtopicItem } from './src/types';
import { STARTER_TEMPLATES, getTemplateById } from './src/data/templates';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// -------------------------------------------------------------
// Global CORS Middleware (Allows cross-origin requests from Vercel & any site)
// -------------------------------------------------------------
app.use((req: Request, res: Response, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Expose-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper to determine public production URL
function getPublicProductionUrl(req?: Request): string {
  // If APP_URL environment variable is provided and not placeholder
  if (process.env.APP_URL && !process.env.APP_URL.includes('MY_APP_URL')) {
    return process.env.APP_URL.replace('ais-dev-', 'ais-pre-').replace(/\/$/, '');
  }

  // Use request host, mapping ais-dev to ais-pre for public embed access
  if (req) {
    const host = req.headers['x-forwarded-host'] || req.headers.host || '';
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const hostStr = Array.isArray(host) ? host[0] : host;
    if (hostStr) {
      const publicHost = hostStr.replace('ais-dev-', 'ais-pre-');
      return `${proto}://${publicHost}`.replace(/\/$/, '');
    }
  }

  return 'https://ais-pre-6l6z2ys5kd7ksf2gj3tepo-765102555479.europe-west2.run.app';
}

// -------------------------------------------------------------
// Embed Widget Script (Served at /widget.js)
// Responds with HTTP 200, CORS: *, No 302 redirects, fully public
// -------------------------------------------------------------
app.get('/widget.js', (req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');

  const publicOrigin = getPublicProductionUrl(req);

  const widgetScript = `
(function() {
  console.log('[SelectBot Widget] Initializing loader v2.0...');

  // 1. Identify this script tag
  var scriptTag = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src && scripts[i].src.indexOf('widget.js') !== -1) {
        return scripts[i];
      }
    }
    return scripts[scripts.length - 1];
  })();

  if (!scriptTag) {
    console.error('[SelectBot Widget] Initialization Error: Could not locate widget <script> element on page.');
    return;
  }

  // 2. Extract bot deployment ID
  var botId = scriptTag.getAttribute('data-bot-id');
  if (!botId) {
    console.error('[SelectBot Widget] Configuration Error: Missing required "data-bot-id" attribute on script tag.');
    console.info('[SelectBot Widget] Expected syntax: <script src="' + (scriptTag.src || '${publicOrigin}/widget.js') + '" data-bot-id="dep_lens_light_pub" async></script>');
    return;
  }

  // 3. Resolve SelectBot Engine Host URL
  // Must use the origin where widget.js was loaded from or the public host, NOT window.location.origin
  var hostUrl = '';
  if (scriptTag.src) {
    try {
      var parsed = new URL(scriptTag.src);
      hostUrl = parsed.origin;
    } catch(e) {
      console.warn('[SelectBot Widget] Could not parse script URL:', e);
    }
  }
  if (!hostUrl || hostUrl === 'null' || hostUrl.indexOf('http') !== 0) {
    hostUrl = '${publicOrigin}';
  }

  // Ensure public endpoint is used if ais-dev was configured
  if (hostUrl.indexOf('ais-dev-') !== -1) {
    console.warn('[SelectBot Widget] Notice: Development URL detected. Automatically routing to public production endpoint (ais-pre-).');
    hostUrl = hostUrl.replace('ais-dev-', 'ais-pre-');
  }

  console.log('[SelectBot Widget] Verified host:', hostUrl, '| Deployment ID:', botId);

  // Prevent duplicate mounts
  if (document.getElementById('selectbot-widget-container')) {
    console.log('[SelectBot Widget] Container already active, skipping re-injection.');
    return;
  }

  // Helper: Display user-visible toast error if initialization fails
  function showBannerError(msg) {
    console.error('[SelectBot Widget] ' + msg);
    var errBox = document.createElement('div');
    errBox.id = 'selectbot-init-notice';
    errBox.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:999999;background:#fff1f2;color:#9f1239;border:1px solid #fecdd3;padding:12px 16px;border-radius:10px;font-family:system-ui,-apple-system,sans-serif;font-size:12px;box-shadow:0 10px 25px rgba(0,0,0,0.1);max-width:360px;line-height:1.4;';
    errBox.innerHTML = '<div style="font-weight:700;margin-bottom:4px;display:flex;align-items:center;gap:6px;"><span>⚠️</span> SelectBot Notice</div><div>' + msg + '</div>';

    function mountNotice() {
      if (document.body) {
        document.body.appendChild(errBox);
        setTimeout(function() {
          if (errBox.parentNode) errBox.parentNode.removeChild(errBox);
        }, 12000);
      }
    }
    if (document.body) mountNotice();
    else window.addEventListener('DOMContentLoaded', mountNotice);
  }

  // 4. Validate deployment with SelectBot backend
  var verifyUrl = hostUrl + '/api/public/bot/' + encodeURIComponent(botId);
  fetch(verifyUrl, { method: 'GET', mode: 'cors' })
    .then(function(res) {
      if (!res.ok) {
        return res.json().catch(function() { return {}; }).then(function(errData) {
          throw new Error(errData.error || ('Server responded with HTTP ' + res.status));
        });
      }
      return res.json();
    })
    .then(function(botData) {
      console.log('[SelectBot Widget] Deployment successfully verified for: ' + (botData.businessName || botData.name));
      mountWidget(botData);
    })
    .catch(function(err) {
      console.warn('[SelectBot Widget] Public validation note (' + err.message + '). Mounting widget frame with fallback configuration.');
      mountWidget(null);
    });

  // 5. Build and inject Launcher + Iframe
  function mountWidget(botData) {
    if (document.getElementById('selectbot-widget-container')) return;

    var container = document.createElement('div');
    container.id = 'selectbot-widget-container';
    container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:999999;font-family:system-ui,-apple-system,sans-serif;pointer-events:none;';

    // The chat widget iframe
    var iframe = document.createElement('iframe');
    iframe.id = 'selectbot-frame';
    iframe.src = hostUrl + '/?embed=true&deploymentId=' + encodeURIComponent(botId);
    iframe.title = (botData && botData.businessName) ? (botData.businessName + ' Chat Assistant') : 'SelectBot Chat Assistant';
    iframe.setAttribute('allow', 'clipboard-write');
    iframe.style.cssText = 'position:fixed;bottom:96px;right:24px;width:390px;height:620px;max-width:calc(100vw - 32px);max-height:calc(100vh - 120px);border:none;border-radius:16px;box-shadow:0 20px 40px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06);display:none;transition:opacity 0.2s ease, transform 0.2s ease;z-index:999998;pointer-events:auto;background:transparent;';

    // Launcher button
    var brandColor = (botData && botData.appearance && botData.appearance.brandColor) || '#4f46e5';

    var button = document.createElement('button');
    button.id = 'selectbot-toggle';
    button.setAttribute('aria-label', 'Open SelectBot Chat');
    button.style.cssText = 'width:58px;height:58px;border-radius:50%;background-color:' + brandColor + ';color:#ffffff;border:none;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,0.22);display:flex;align-items:center;justify-content:center;outline:none;transition:transform 0.2s ease,box-shadow 0.2s ease;pointer-events:auto;';

    var chatIconSvg = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
    var closeIconSvg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

    button.innerHTML = chatIconSvg;

    button.onmouseover = function() {
      button.style.transform = 'scale(1.06)';
      button.style.boxShadow = '0 10px 28px rgba(0,0,0,0.28)';
    };
    button.onmouseout = function() {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 8px 24px rgba(0,0,0,0.22)';
    };

    var isOpen = false;
    button.onclick = function() {
      isOpen = !isOpen;
      if (isOpen) {
        iframe.style.display = 'block';
        button.innerHTML = closeIconSvg;
        button.setAttribute('aria-label', 'Close SelectBot Chat');
      } else {
        iframe.style.display = 'none';
        button.innerHTML = chatIconSvg;
        button.setAttribute('aria-label', 'Open SelectBot Chat');
      }
    };

    container.appendChild(iframe);
    container.appendChild(button);

    function attach() {
      if (document.body) {
        document.body.appendChild(container);
        console.log('[SelectBot Widget] Chat widget launcher created successfully on page.');
      }
    }

    if (document.body) {
      attach();
    } else {
      window.addEventListener('DOMContentLoaded', attach);
    }
  }
})();
`;
  res.status(200).send(widgetScript);
});

// -------------------------------------------------------------
// API Routes
// -------------------------------------------------------------

// 1. Workspaces (Authentication handled exclusively by Firebase Authentication & Firestore)

app.post('/api/workspaces', (req: Request, res: Response) => {
  const { name, industry } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Workspace name is required' });
  }
  const ws = DB.createWorkspace(name, industry || 'General Business', 'kutlee36@gmail.com');
  res.status(201).json(ws);
});

// 2. Chatbots Management
app.get('/api/bots', (req: Request, res: Response) => {
  const workspaceId = req.query.workspaceId as string | undefined;
  const bots = DB.getChatbots(workspaceId);
  res.json(bots);
});

app.get('/api/bots/:id', (req: Request, res: Response) => {
  const bot = DB.getChatbot(req.params.id);
  if (!bot) {
    return res.status(404).json({ error: 'Chatbot not found' });
  }
  res.json(bot);
});

app.post('/api/bots', (req: Request, res: Response) => {
  const {
    workspaceId,
    name,
    businessName,
    industry,
    description,
    website,
    contactEmail,
    contactPhone,
    templateId,
    conversationStyle,
  } = req.body;

  if (!name || !businessName) {
    return res.status(400).json({ error: 'Chatbot name and business name are required' });
  }

  const template = getTemplateById(templateId || 'general');
  const botId = `bot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const deploymentId = `dep_${Math.random().toString(36).substring(2, 10)}`;

  const newBot: ChatbotConfig = {
    id: botId,
    workspaceId: workspaceId || 'ws_default_1',
    name,
    businessName,
    industry: industry || template.industry,
    description: description || template.description,
    website: website || '',
    contactEmail: contactEmail || '',
    contactPhone: contactPhone || '',
    conversationStyle: conversationStyle || 'hybrid',
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    currency: 'ZAR',
    mainMenuItems: JSON.parse(JSON.stringify(template.defaultMenuItems)),
    appearance: {
      botDisplayName: `${businessName} Assistant`,
      greetingMessage: `Hey! Welcome to ${businessName}. How can we help you today?`,
      logoUrl: '',
      brandColor: '#4f46e5',
      accentColor: '#6366f1',
      launcherPosition: 'bottom_right',
      headerStyle: 'solid',
      widgetSize: 'standard',
      welcomeScreenText: 'Select an option below or type your question.',
    },
    deployment: {
      deploymentId,
      isEnabled: true,
      allowedDomains: ['*'],
      embedSnippet: `<script src="/widget.js" data-bot-id="${deploymentId}" async></script>`,
      whatsappConfig: {
        isConnected: false,
        status: 'disconnected',
      },
    },
    aiConfig: {
      model: 'gemini-3.8-flash',
      systemPrompt: template.defaultAiPrompt,
      temperature: 0.3,
      greetingMessage: `Hey! Welcome to ${businessName}. How can we help you today?`,
      fallbackMessage: `I'd love to help you with that! Please choose an option from the menu below or tap 'Talk to a Person'.`,
    },
  };

  DB.createChatbot(newBot);

  // Seed default knowledge base items for the new bot
  if (template.defaultKnowledge && template.defaultKnowledge.length > 0) {
    template.defaultKnowledge.forEach((k) => {
      DB.addKnowledge({
        botId: newBot.id,
        title: k.title,
        category: k.category,
        type: k.type,
        content: k.content,
        tags: k.tags,
        ingestionStatus: 'ready',
      });
    });
  }

  res.status(201).json(newBot);
});

app.put('/api/bots/:id', (req: Request, res: Response) => {
  const updated = DB.updateChatbot(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Chatbot not found' });
  }
  res.json(updated);
});

app.post('/api/bots/:id/duplicate', (req: Request, res: Response) => {
  const original = DB.getChatbot(req.params.id);
  if (!original) {
    return res.status(404).json({ error: 'Chatbot not found' });
  }

  const dupId = `bot_${Date.now()}_copy`;
  const dupDepId = `dep_${Math.random().toString(36).substring(2, 10)}`;
  const duplicatedBot: ChatbotConfig = {
    ...JSON.parse(JSON.stringify(original)),
    id: dupId,
    name: `${original.name} (Copy)`,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deployment: {
      ...original.deployment,
      deploymentId: dupDepId,
      embedSnippet: `<script src="/widget.js" data-bot-id="${dupDepId}" async></script>`,
    },
  };

  DB.createChatbot(duplicatedBot);

  // Duplicate knowledge items
  const originalKnowledge = DB.getKnowledge(original.id);
  originalKnowledge.forEach((item) => {
    DB.addKnowledge({
      botId: duplicatedBot.id,
      title: item.title,
      category: item.category,
      type: item.type,
      content: item.content,
      tags: item.tags,
      ingestionStatus: 'ready',
    });
  });

  res.status(201).json(duplicatedBot);
});

app.delete('/api/bots/:id', (req: Request, res: Response) => {
  const ok = DB.deleteChatbot(req.params.id);
  if (!ok) {
    return res.status(404).json({ error: 'Chatbot not found' });
  }
  res.json({ success: true, message: 'Chatbot deleted successfully' });
});

app.post('/api/bots/:id/publish', (req: Request, res: Response) => {
  const bot = DB.getChatbot(req.params.id);
  if (!bot) {
    return res.status(404).json({ error: 'Chatbot not found' });
  }

  const nextStatus = bot.status === 'published' ? 'draft' : 'published';
  const updated = DB.updateChatbot(bot.id, {
    status: nextStatus,
    lastPublishedAt: nextStatus === 'published' ? new Date().toISOString() : bot.lastPublishedAt,
  });

  res.json({
    success: true,
    status: nextStatus,
    bot: updated,
  });
});

// 3. Knowledge Base Endpoints
app.get('/api/bots/:id/knowledge', (req: Request, res: Response) => {
  const items = DB.getKnowledge(req.params.id);
  res.json(items);
});

app.post('/api/bots/:id/knowledge', (req: Request, res: Response) => {
  const { title, category, type, content, tags } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const item = DB.addKnowledge({
    botId: req.params.id,
    title,
    category: category || 'general',
    type: type || 'text',
    content,
    tags: Array.isArray(tags) ? tags : [],
    ingestionStatus: 'ready',
  });
  res.status(201).json(item);
});

app.put('/api/bots/:id/knowledge/:itemId', (req: Request, res: Response) => {
  const updated = DB.updateKnowledge(req.params.itemId, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Knowledge item not found' });
  }
  res.json(updated);
});

app.delete('/api/bots/:id/knowledge/:itemId', (req: Request, res: Response) => {
  const ok = DB.deleteKnowledge(req.params.itemId);
  if (!ok) {
    return res.status(404).json({ error: 'Knowledge item not found' });
  }
  res.json({ success: true });
});

// Knowledge query tester
app.post('/api/bots/:id/knowledge/test-query', (req: Request, res: Response) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }
  const knowledge = DB.getKnowledge(req.params.id);
  const matches = retrieveRelevantKnowledge(query, knowledge, 5);
  res.json({
    query,
    totalDocuments: knowledge.length,
    matchesCount: matches.length,
    matches,
  });
});

// 4. Human Assistance & Inbox
app.get('/api/inbox/all', (req: Request, res: Response) => {
  const requests = DB.getHandoffRequests();
  res.json(requests);
});

app.get('/api/bots/:id/inbox', (req: Request, res: Response) => {
  const requests = DB.getHandoffRequests(req.params.id);
  res.json(requests);
});

app.put('/api/inbox/:requestId', (req: Request, res: Response) => {
  const { status, agentNotes, assignedTo } = req.body;
  const updates: any = {};
  if (status) {
    updates.status = status;
    if (status === 'resolved') {
      updates.resolvedAt = new Date().toISOString();
    }
  }
  if (agentNotes !== undefined) updates.agentNotes = agentNotes;
  if (assignedTo !== undefined) updates.assignedTo = assignedTo;

  const updated = DB.updateHandoffRequest(req.params.requestId, updates);
  if (!updated) {
    return res.status(404).json({ error: 'Handoff request not found' });
  }
  res.json(updated);
});

// Agent reply to handoff request
app.post('/api/inbox/:requestId/reply', (req: Request, res: Response) => {
  const { replyText, agentName } = req.body;
  if (!replyText) {
    return res.status(400).json({ error: 'Reply text is required' });
  }

  const handoff = DB.getHandoffRequest(req.params.requestId);
  if (!handoff) {
    return res.status(404).json({ error: 'Handoff request not found' });
  }

  // Update handoff status
  DB.updateHandoffRequest(handoff.id, {
    status: 'in_progress',
    agentNotes: handoff.agentNotes ? `${handoff.agentNotes}\n[Reply sent]: ${replyText}` : `[Reply sent]: ${replyText}`,
  });

  // Append message to conversation
  const conv = DB.getConversation(handoff.conversationId);
  if (conv) {
    const agentMsg: ChatMessage = {
      id: `msg_agent_${Date.now()}`,
      conversationId: conv.id,
      sender: 'agent',
      text: replyText,
      timestamp: new Date().toISOString(),
    };
    conv.messages.push(agentMsg);
    conv.lastActivityAt = new Date().toISOString();
    DB.saveConversation(conv);
  }

  res.json({ success: true, message: 'Reply sent to customer conversation' });
});

// 5. Action Submissions (Bookings, Quotes, Leads)
app.get('/api/bots/:id/actions/submissions', (req: Request, res: Response) => {
  const subs = DB.getActionSubmissions(req.params.id);
  res.json(subs);
});

app.get('/api/actions/submissions/all', (req: Request, res: Response) => {
  const subs = DB.getActionSubmissions();
  res.json(subs);
});

// 6. Analytics
app.get('/api/analytics', (req: Request, res: Response) => {
  const botId = req.query.botId as string | undefined;
  const analytics = DB.getAnalytics(botId);
  res.json(analytics);
});

// 7. Public Bot Config (for Widget & External Embeds)
const handlePublicBotConfig = (req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, max-age=30');

  const deploymentId = req.params.deploymentId;
  const bot = DB.getChatbotByDeployment(deploymentId);
  if (!bot) {
    return res.status(404).json({ error: `Chatbot deployment "${deploymentId}" was not found.` });
  }

  if (bot.status !== 'published') {
    return res.status(403).json({
      error: 'This chatbot is currently in draft mode and not published.',
      status: 'draft',
    });
  }

  if (!bot.deployment.isEnabled) {
    return res.status(403).json({
      error: 'This chatbot deployment has been disabled by its administrator.',
      status: 'disabled',
    });
  }

  // Domain security check (if allowedDomains does not include wildcard '*')
  const origin = (req.headers.origin as string) || (req.headers.referer as string) || '';
  const allowed = bot.deployment.allowedDomains || ['*'];
  const isAllowed =
    allowed.includes('*') ||
    allowed.some((d: string) => {
      const clean = d.replace(/^https?:\/\//, '').replace(/\/$/, '');
      return origin.includes(clean);
    });

  if (!isAllowed) {
    return res.status(403).json({
      error: `Domain "${origin}" is not authorized for this chatbot deployment.`,
      status: 'domain_restricted',
    });
  }

  // Return public-safe payload
  res.json({
    id: bot.id,
    name: bot.name,
    businessName: bot.businessName,
    industry: bot.industry,
    description: bot.description,
    currency: bot.currency || 'ZAR',
    conversationStyle: bot.conversationStyle,
    appearance: bot.appearance,
    deployment: {
      deploymentId: bot.deployment.deploymentId,
      isEnabled: bot.deployment.isEnabled,
      allowedDomains: bot.deployment.allowedDomains,
    },
    mainMenuItems: bot.mainMenuItems.filter((m) => !m.isHidden),
    greetingMessage: bot.appearance.greetingMessage,
  });
};

app.get('/api/public/bot/:deploymentId', handlePublicBotConfig);
app.get('/api/bots/public/:deploymentId', handlePublicBotConfig);

// 8. Chat Session & Message Runtime (Core Engine)
app.post('/api/chat/session', (req: Request, res: Response) => {
  const { botId, customerSessionId, customerName, customerContact } = req.body;
  const bot = DB.getChatbot(botId);
  if (!bot) {
    return res.status(404).json({ error: 'Chatbot not found' });
  }

  const convId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const initialGreeting: ChatMessage = {
    id: `msg_init_${Date.now()}`,
    conversationId: convId,
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

  const newConv: Conversation = {
    id: convId,
    botId: bot.id,
    customerSessionId: customerSessionId || `client_${Date.now()}`,
    customerName,
    customerContact,
    startedAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
    status: 'active',
    messages: [initialGreeting],
  };

  DB.saveConversation(newConv);
  res.json({ conversation: newConv, botName: bot.businessName });
});

app.post('/api/chat/message', async (req: Request, res: Response) => {
  const {
    conversationId,
    botId,
    text,
    selectedMenuId,
    selectedSubtopicId,
    actionSubmission,
    handoffSubmission,
    isNavigationAction,
  } = req.body;

  const bot = DB.getChatbot(botId);
  if (!bot) {
    return res.status(404).json({ error: 'Chatbot not found' });
  }

  let conv = DB.getConversation(conversationId);
  if (!conv) {
    conv = {
      id: conversationId || `conv_${Date.now()}`,
      botId: bot.id,
      customerSessionId: `client_${Date.now()}`,
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      status: 'active',
      messages: [],
    };
  }

  // 1. Check if user is navigating: Return to Main Menu
  if (isNavigationAction === 'main_menu') {
    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      conversationId: conv.id,
      sender: 'customer',
      text: 'Main Menu',
      timestamp: new Date().toISOString(),
    };
    conv.messages.push(userMsg);

    const botMsg: ChatMessage = {
      id: `msg_b_${Date.now()}`,
      conversationId: conv.id,
      sender: 'bot',
      text: 'Here is our main menu. Please select what you need:',
      timestamp: new Date().toISOString(),
      payload: {
        type: 'menu',
        menuItems: bot.mainMenuItems
          .filter((m) => !m.isHidden)
          .map((m) => ({ id: m.id, title: m.title, description: m.description, icon: m.icon })),
      },
    };
    conv.messages.push(botMsg);
    conv.lastActivityAt = new Date().toISOString();
    DB.saveConversation(conv);
    return res.json({ botResponse: botMsg, conversation: conv });
  }

  // 2. Check if a Main Menu Item was selected
  if (selectedMenuId && !selectedSubtopicId) {
    const menuItem = bot.mainMenuItems.find((m) => m.id === selectedMenuId);
    if (menuItem) {
      DB.recordMenuClick(bot.id, menuItem.id);

      const userMsg: ChatMessage = {
        id: `msg_u_${Date.now()}`,
        conversationId: conv.id,
        sender: 'customer',
        text: menuItem.title,
        timestamp: new Date().toISOString(),
      };
      conv.messages.push(userMsg);

      // Render subtopics
      const botMsg: ChatMessage = {
        id: `msg_b_${Date.now()}`,
        conversationId: conv.id,
        sender: 'bot',
        text: menuItem.introductoryMessage?.trim() || (menuItem.description ? `${menuItem.title} — ${menuItem.description}` : `Select an option under ${menuItem.title}:`),
        timestamp: new Date().toISOString(),
        payload: {
          type: 'subtopic',
          breadcrumbs: [{ label: 'Main Menu' }, { label: menuItem.title, menuId: menuItem.id }],
          subtopics: menuItem.subtopics.map((s) => ({
            id: s.id,
            title: s.title,
            description: s.description,
            contentType: s.contentType,
          })),
        },
      };
      conv.messages.push(botMsg);
      conv.lastActivityAt = new Date().toISOString();
      DB.saveConversation(conv);
      return res.json({ botResponse: botMsg, conversation: conv });
    }
  }

  // 3. Check if a Subtopic was selected
  if (selectedMenuId && selectedSubtopicId) {
    const menuItem = bot.mainMenuItems.find((m) => m.id === selectedMenuId);
    const subtopic = menuItem?.subtopics.find((s) => s.id === selectedSubtopicId);

    if (subtopic) {
      const userMsg: ChatMessage = {
        id: `msg_u_${Date.now()}`,
        conversationId: conv.id,
        sender: 'customer',
        text: subtopic.title,
        timestamp: new Date().toISOString(),
      };
      conv.messages.push(userMsg);

      let payload: any = {
        type: 'content',
        breadcrumbs: [
          { label: 'Main Menu' },
          { label: menuItem!.title, menuId: menuItem!.id },
          { label: subtopic.title, subtopicId: subtopic.id },
        ],
        contentView: {
          contentType: subtopic.contentType,
          title: subtopic.title,
          data: subtopic.content,
        },
      };

      let responseText = `Here is the information for ${subtopic.title}:`;

      if (subtopic.contentType === 'action' && subtopic.content.action) {
        payload.type = 'action_form';
        payload.actionForm = subtopic.content.action;
        responseText = `Please complete the following details for your ${subtopic.content.action.title}:`;
      } else if (subtopic.contentType === 'human_assistance' && subtopic.content.humanAssistance) {
        payload.type = 'handoff_form';
        payload.handoffForm = subtopic.content.humanAssistance;
        responseText = subtopic.content.humanAssistance.introductoryMessage;
      }

      const botMsg: ChatMessage = {
        id: `msg_b_${Date.now()}`,
        conversationId: conv.id,
        sender: 'bot',
        text: responseText,
        timestamp: new Date().toISOString(),
        payload,
      };

      conv.messages.push(botMsg);
      conv.lastActivityAt = new Date().toISOString();
      DB.saveConversation(conv);
      return res.json({ botResponse: botMsg, conversation: conv });
    }
  }

  // 4. Handle Action Form Submission (e.g. Booking, Quote, Contact)
  if (actionSubmission) {
    const { actionId, actionTitle, formData } = actionSubmission;
    const sub = DB.createActionSubmission({
      actionId: actionId || 'act_general',
      actionType: 'form_submission',
      actionTitle: actionTitle || 'Form Submission',
      botId: bot.id,
      conversationId: conv.id,
      data: formData || {},
      status: 'new',
    });

    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      conversationId: conv.id,
      sender: 'customer',
      text: `[Submitted: ${actionTitle || 'Request'}]`,
      timestamp: new Date().toISOString(),
    };
    conv.messages.push(userMsg);

    const botMsg: ChatMessage = {
      id: `msg_b_${Date.now()}`,
      conversationId: conv.id,
      sender: 'bot',
      text: `Thank you! Your ${actionTitle || 'request'} has been successfully received. Reference #${sub.id.substring(4, 9).toUpperCase()}. Our team will review it shortly.`,
      timestamp: new Date().toISOString(),
      payload: {
        type: 'action_success',
        actionSuccess: {
          actionId: sub.actionId,
          message: `Submission confirmed. Reference ID: ${sub.id}`,
        },
        breadcrumbs: [{ label: 'Main Menu' }],
      },
    };
    conv.messages.push(botMsg);
    conv.lastActivityAt = new Date().toISOString();
    DB.saveConversation(conv);
    return res.json({ botResponse: botMsg, conversation: conv, submission: sub });
  }

  // 5. Handle Human Assistance Submission
  if (handoffSubmission) {
    const { customerName, customerContact, message, handoffDestination } = handoffSubmission;

    const handoffReq = DB.createHandoffRequest({
      conversationId: conv.id,
      botId: bot.id,
      customerName: customerName || 'Website Visitor',
      customerContact: customerContact || 'None provided',
      message: message || text || 'Customer requested human assistance.',
      historyExcerpt: conv.messages
        .slice(-4)
        .map((m) => `${m.sender}: ${m.text}`)
        .join(' | '),
      status: 'new',
      handoffDestination: handoffDestination || 'dashboard_inbox',
      deliveryStatus: 'delivered',
    });

    conv.status = 'handoff_requested';
    conv.customerName = customerName || conv.customerName;
    conv.customerContact = customerContact || conv.customerContact;

    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      conversationId: conv.id,
      sender: 'customer',
      text: message || 'Submitted message for human staff.',
      timestamp: new Date().toISOString(),
    };
    conv.messages.push(userMsg);

    const botMsg: ChatMessage = {
      id: `msg_b_${Date.now()}`,
      conversationId: conv.id,
      sender: 'bot',
      text: `Your message has been delivered to our team! Request ID: #${handoffReq.id.substring(8, 14).toUpperCase()}. A member of our staff will get back to you directly.`,
      timestamp: new Date().toISOString(),
      payload: {
        type: 'handoff_success',
        breadcrumbs: [{ label: 'Main Menu' }],
      },
    };
    conv.messages.push(botMsg);
    conv.lastActivityAt = new Date().toISOString();
    DB.saveConversation(conv);
    return res.json({ botResponse: botMsg, conversation: conv, handoff: handoffReq });
  }

  // 6. Free-Text Natural Language Chat Processing
  if (text) {
    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      conversationId: conv.id,
      sender: 'customer',
      text,
      timestamp: new Date().toISOString(),
    };
    conv.messages.push(userMsg);

    // If bot is strictly 'guided' mode:
    if (bot.conversationStyle === 'guided') {
      const botMsg: ChatMessage = {
        id: `msg_b_${Date.now()}`,
        conversationId: conv.id,
        sender: 'bot',
        text: `Thanks for your message! This assistant is configured in Guided Menu mode. Please select an option from our main menu below:`,
        timestamp: new Date().toISOString(),
        payload: {
          type: 'menu',
          menuItems: bot.mainMenuItems
            .filter((m) => !m.isHidden)
            .map((m) => ({ id: m.id, title: m.title, description: m.description, icon: m.icon })),
        },
      };
      conv.messages.push(botMsg);
      conv.lastActivityAt = new Date().toISOString();
      DB.saveConversation(conv);
      return res.json({ botResponse: botMsg, conversation: conv });
    }

    // Hybrid or AI mode: Retrieve relevant knowledge and generate Gemini response
    const knowledgeBase = DB.getKnowledge(bot.id);
    const relevantDocs = retrieveRelevantKnowledge(text, knowledgeBase, 3);

    // Format history for Gemini
    const historyPayload = conv.messages.slice(-8).map((m) => ({
      role: (m.sender === 'customer' ? 'user' : 'model') as 'user' | 'model',
      text: m.text,
    }));

    const aiResult = await generateAIResponse(bot, text, relevantDocs, historyPayload);

    const botMsg: ChatMessage = {
      id: `msg_b_${Date.now()}`,
      conversationId: conv.id,
      sender: 'bot',
      text: aiResult.text,
      timestamp: new Date().toISOString(),
      payload: {
        type: 'ai_response',
        sourceConfidence: aiResult.sourceConfidence,
        breadcrumbs: [{ label: 'Main Menu' }],
      },
    };

    conv.messages.push(botMsg);
    conv.lastActivityAt = new Date().toISOString();
    DB.saveConversation(conv);
    return res.json({ botResponse: botMsg, conversation: conv });
  }

  res.status(400).json({ error: 'No actionable message payload received' });
});

// 9. WhatsApp Integration Mock / Webhook Simulator
app.get('/api/integrations/whatsapp/verify', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === 'SELECTBOT_WHATSAPP_TOKEN') {
    return res.status(200).send(challenge);
  }
  res.status(403).json({ error: 'Verification token mismatch' });
});

app.post('/api/integrations/whatsapp/webhook', (req: Request, res: Response) => {
  res.json({ status: 'received' });
});

// -------------------------------------------------------------
// Vite Middleware / Static Serving Setup
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SelectBot full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
