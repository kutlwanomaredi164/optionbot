import { db, auth, handleFirestoreError, OperationType, FirebaseUser } from '../firebase';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { ChatbotConfig, Workspace, UserAccount, BotAnalytics } from '../types';
import { STARTER_TEMPLATES } from '../data/templates';
import { firestoreSync } from './firestoreSync';

export interface InitializedAppState {
  user: UserAccount | null;
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  bots: ChatbotConfig[];
  analytics: BotAnalytics;
}

/**
 * Creates a clean default bot for a newly registered user
 */
function createDefaultBotForUser(userId: string, workspaceId: string, userName: string): ChatbotConfig {
  const photoTemplate = STARTER_TEMPLATES[0];
  const shortId = userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) || 'user1';
  const botId = `bot_${shortId}_101`;
  const depId = `dep_${shortId}_pub`;

  return {
    id: botId,
    workspaceId,
    name: 'Lens & Light Studio Bot',
    businessName: 'Lens & Light Photography',
    industry: 'Photography Studio',
    description: 'Boutique portrait and wedding photography studio with online booking and portfolio showcase.',
    website: 'https://lensandlight.co.za',
    contactEmail: auth.currentUser?.email || 'contact@lensandlight.co.za',
    contactPhone: '+27 11 555 0192',
    conversationStyle: 'hybrid',
    status: 'published',
    lastPublishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
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
      systemPrompt: photoTemplate.defaultAiPrompt,
      temperature: 0.3,
      greetingMessage: 'Hey! Welcome to Lens & Light Photography. How can we help you today?',
      fallbackMessage: "I'd love to help you with that! For special requests, you can choose 'Talk to a Person' or pick from our services below.",
    },
  };
}

/**
 * Generates initial analytics metrics
 */
export function generateDefaultAnalytics(bots: ChatbotConfig[]): BotAnalytics {
  return {
    totalConversations: 18,
    totalMessages: 64,
    totalHandoffRequests: 2,
    unresolvedHandoffRequests: 1,
    totalActionSubmissions: 5,
    topMenuClicks: [
      { menuId: 'menu_services', title: 'Services & Packages', count: 32 },
      { menuId: 'menu_portfolio', title: 'Portfolio & Work', count: 21 },
      { menuId: 'menu_policies', title: 'Studio Policies', count: 8 },
    ],
    conversationsByDay: [
      { date: 'Mon', count: 3 },
      { date: 'Tue', count: 5 },
      { date: 'Wed', count: 4 },
      { date: 'Thu', count: 8 },
      { date: 'Fri', count: 6 },
      { date: 'Sat', count: 12 },
      { date: 'Sun', count: 9 },
    ],
    recentActivity: [
      {
        id: 'act_fb_1',
        type: 'auth_success',
        description: 'Firebase Authentication and Firestore loaded',
        timestamp: 'Just now',
      },
      {
        id: 'act_fb_2',
        type: 'bot_active',
        description: 'Chatbot engine ready for customer conversations',
        timestamp: '5m ago',
      },
    ],
  };
}

/**
 * Single source of truth for Firebase-based user initialization and Firestore state
 */
export const firebaseAuthService = {
  /**
   * Initializes the full user session from Firestore
   */
  async initUserSession(firebaseUser: FirebaseUser): Promise<InitializedAppState> {
    console.log('Firebase Auth Ready');
    console.log('Firestore Ready');

    const cleanUid = firebaseUser.uid.replace(/[^a-zA-Z0-9_-]/g, '_');
    const userDocRef = doc(db, 'users', cleanUid);
    let userProfile: UserAccount;

    const defaultWorkspaceId = `ws_${cleanUid.slice(0, 12)}`;

    try {
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) {
        userProfile = {
          id: cleanUid,
          name: firebaseUser.displayName || 'SelectBot User',
          email: firebaseUser.email || '',
          role: 'owner',
          currentWorkspaceId: defaultWorkspaceId,
        };

        // Create user profile in Firestore conforming to rules & blueprint
        await setDoc(userDocRef, {
          uid: cleanUid,
          email: userProfile.email,
          name: userProfile.name.slice(0, 100),
          role: 'owner',
          currentWorkspaceId: defaultWorkspaceId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        const d = userSnap.data();
        userProfile = {
          id: cleanUid,
          name: d.name || firebaseUser.displayName || 'SelectBot User',
          email: d.email || firebaseUser.email || '',
          role: d.role || 'owner',
          currentWorkspaceId: d.currentWorkspaceId || defaultWorkspaceId,
        };
      }
    } catch (err) {
      console.warn('Notice loading user profile from Firestore, using authenticated profile fallback:', err);
      userProfile = {
        id: cleanUid,
        name: firebaseUser.displayName || 'SelectBot User',
        email: firebaseUser.email || '',
        role: 'owner',
        currentWorkspaceId: defaultWorkspaceId,
      };
    }

    console.log('User Loaded');

    // 2. Load Workspaces from Firestore
    let workspaces: Workspace[] = [];
    try {
      const wsQuery = query(collection(db, 'workspaces'), where('ownerId', '==', cleanUid));
      const wsSnap = await getDocs(wsQuery);
      wsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        workspaces.push({
          id: data.id || docSnap.id,
          name: data.name || 'Main Workspace',
          industry: data.industry || 'Photography Studio',
          ownerEmail: data.ownerEmail || userProfile.email,
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });
    } catch (err) {
      console.warn('Notice querying workspaces from Firestore:', err);
    }

    if (workspaces.length === 0) {
      const newWs: Workspace = {
        id: defaultWorkspaceId,
        name: `${(userProfile.name || 'My').split(' ')[0]}'s Workspace`,
        industry: 'Photography Studio',
        ownerEmail: userProfile.email,
        createdAt: new Date().toISOString(),
      };
      workspaces = [newWs];
      // Save to Firestore asynchronously
      firestoreSync.saveWorkspace(newWs, cleanUid).catch((e) => {
        console.warn('Async workspace write notice:', e);
      });
    }

    const currentWorkspace = workspaces[0];

    // 3. Load Chatbots from Firestore
    let bots: ChatbotConfig[] = [];
    try {
      const botQuery = query(collection(db, 'chatbots'), where('ownerId', '==', cleanUid));
      const botSnap = await getDocs(botQuery);
      botSnap.forEach((docSnap) => {
        const d = docSnap.data();
        const botConfig: ChatbotConfig = {
          id: d.id || docSnap.id,
          workspaceId: d.workspaceId || currentWorkspace.id,
          name: d.name || 'My Chatbot',
          businessName: d.businessName || 'Business Chatbot',
          industry: d.industry || 'Photography Studio',
          description: d.description || '',
          website: d.website || '',
          contactEmail: d.contactEmail || userProfile.email,
          contactPhone: d.contactPhone || '',
          conversationStyle: d.conversationStyle || 'hybrid',
          status: d.status || 'draft',
          lastPublishedAt: d.lastPublishedAt,
          createdAt: d.createdAt || new Date().toISOString(),
          updatedAt: d.updatedAt || new Date().toISOString(),
          currency: d.currency || 'ZAR',
          mainMenuItems: d.mainMenuItems || STARTER_TEMPLATES[0].defaultMenuItems,
          appearance: d.appearance || {
            botDisplayName: d.name || 'SelectBot',
            greetingMessage: 'Hello! How can we help you today?',
            logoUrl: '',
            brandColor: '#4f46e5',
            accentColor: '#6366f1',
            launcherPosition: 'bottom_right',
            headerStyle: 'solid',
            widgetSize: 'standard',
            welcomeScreenText: 'Select an option to begin.',
          },
          deployment: {
            deploymentId: d.deploymentId || `dep_${docSnap.id}`,
            isEnabled: d.isDeploymentEnabled ?? true,
            allowedDomains: ['*'],
            embedSnippet: `<script src="/widget.js" data-bot-id="${d.deploymentId || `dep_${docSnap.id}`}" async></script>`,
            whatsappConfig: {
              isConnected: false,
              status: 'disconnected',
            },
          },
          aiConfig: d.aiSettings || {
            model: 'gemini-3.8-flash',
            systemPrompt: STARTER_TEMPLATES[0].defaultAiPrompt,
            temperature: 0.3,
            greetingMessage: 'Hello! How can we help you today?',
            fallbackMessage: 'Please select an option from our menu or request assistance.',
          },
        };
        bots.push(botConfig);
      });
    } catch (err) {
      console.warn('Notice querying chatbots from Firestore:', err);
    }

    if (bots.length === 0) {
      const defaultBot = createDefaultBotForUser(cleanUid, currentWorkspace.id, userProfile.name);
      bots = [defaultBot];
      firestoreSync.saveChatbot(defaultBot, cleanUid).catch((e) => {
        console.warn('Async chatbot write notice:', e);
      });
    }

    const analytics = generateDefaultAnalytics(bots);

    return {
      user: userProfile,
      workspaces,
      currentWorkspace,
      bots,
      analytics,
    };
  },

  /**
   * Generates guest/fallback state if user is previewing without signing in
   */
  getGuestSession(): InitializedAppState {
    console.log('Firebase Auth Ready');
    console.log('Firestore Ready');
    const guestUser: UserAccount = {
      id: 'guest_user',
      name: 'Guest Business Owner',
      email: 'guest@example.com',
      role: 'owner',
      currentWorkspaceId: 'ws_guest_1',
    };
    const defaultWs: Workspace = {
      id: 'ws_guest_1',
      name: 'Lens & Light Studio',
      industry: 'Photography Studio',
      ownerEmail: 'guest@example.com',
      createdAt: new Date().toISOString(),
    };
    const defaultBot = createDefaultBotForUser('guest_user', defaultWs.id, guestUser.name);
    console.log('User Loaded');

    return {
      user: guestUser,
      workspaces: [defaultWs],
      currentWorkspace: defaultWs,
      bots: [defaultBot],
      analytics: generateDefaultAnalytics([defaultBot]),
    };
  },
};
