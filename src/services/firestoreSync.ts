import { db, handleFirestoreError, OperationType, auth } from '../firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { ChatbotConfig, ChatMessage, Conversation, HumanAssistanceRequest, ActionSubmission, KnowledgeBaseItem, Workspace } from '../types';

/**
 * Service to sync and persist data to Firestore following the schema defined in firebase-blueprint.json
 */
export const firestoreSync = {
  /**
   * Save or update a workspace in Firestore
   */
  async saveWorkspace(workspace: Workspace, userId: string): Promise<void> {
    const path = `workspaces/${workspace.id}`;
    try {
      await setDoc(doc(db, 'workspaces', workspace.id), {
        id: workspace.id,
        name: workspace.name.slice(0, 120),
        industry: (workspace.industry || 'General').slice(0, 100),
        ownerId: userId,
        ownerEmail: auth.currentUser?.email || '',
        createdAt: workspace.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  /**
   * Save or update a chatbot configuration in Firestore
   */
  async saveChatbot(bot: ChatbotConfig, userId: string): Promise<void> {
    const path = `chatbots/${bot.id}`;
    try {
      await setDoc(doc(db, 'chatbots', bot.id), {
        id: bot.id,
        workspaceId: bot.workspaceId,
        ownerId: userId,
        name: bot.name.slice(0, 120),
        businessName: bot.businessName.slice(0, 120),
        industry: (bot.industry || 'General').slice(0, 100),
        status: bot.status || 'draft',
        currency: bot.currency || 'ZAR',
        conversationStyle: bot.conversationStyle || 'hybrid',
        deploymentId: bot.deployment?.deploymentId || '',
        isDeploymentEnabled: Boolean(bot.deployment?.isEnabled),
        website: bot.website || '',
        contactEmail: bot.contactEmail || '',
        contactPhone: bot.contactPhone || '',
        description: (bot.description || '').slice(0, 1000),
        mainMenuItems: bot.mainMenuItems || [],
        appearance: bot.appearance || {},
        aiSettings: bot.aiConfig || {},
        createdAt: bot.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  /**
   * Sync a conversation session to Firestore
   */
  async saveConversation(botId: string, conversation: Conversation): Promise<void> {
    const path = `chatbots/${botId}/conversations/${conversation.id}`;
    try {
      await setDoc(doc(db, 'chatbots', botId, 'conversations', conversation.id), {
        id: conversation.id,
        botId,
        customerSessionId: conversation.customerSessionId || '',
        status: conversation.status || 'active',
        startedAt: conversation.startedAt || new Date().toISOString(),
        lastActivityAt: conversation.lastActivityAt || new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  /**
   * Add a chat message to Firestore under a conversation
   */
  async saveChatMessage(botId: string, conversationId: string, message: ChatMessage): Promise<void> {
    const path = `chatbots/${botId}/conversations/${conversationId}/messages/${message.id}`;
    try {
      await setDoc(doc(db, 'chatbots', botId, 'conversations', conversationId, 'messages', message.id), {
        id: message.id,
        conversationId,
        sender: message.sender,
        text: (message.text || '').slice(0, 4000),
        timestamp: message.timestamp || new Date().toISOString(),
        payload: message.payload || null,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  /**
   * Save a handoff request to Firestore
   */
  async saveHandoffRequest(botId: string, handoff: HumanAssistanceRequest): Promise<void> {
    const path = `chatbots/${botId}/handoffRequests/${handoff.id}`;
    try {
      await setDoc(doc(db, 'chatbots', botId, 'handoffRequests', handoff.id), {
        id: handoff.id,
        botId,
        conversationId: handoff.conversationId,
        customerName: (handoff.customerName || 'Anonymous').slice(0, 120),
        customerContact: (handoff.customerContact || '').slice(0, 160),
        message: (handoff.message || '').slice(0, 4000),
        status: handoff.status || 'new',
        createdAt: handoff.createdAt || new Date().toISOString(),
        agentNotes: handoff.agentNotes || '',
        assignedTo: handoff.assignedTo || '',
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  /**
   * Save an action submission to Firestore
   */
  async saveActionSubmission(botId: string, submission: ActionSubmission): Promise<void> {
    const path = `chatbots/${botId}/actionSubmissions/${submission.id}`;
    try {
      await setDoc(doc(db, 'chatbots', botId, 'actionSubmissions', submission.id), {
        id: submission.id,
        botId,
        actionId: submission.actionId,
        actionTitle: (submission.actionTitle || '').slice(0, 120),
        actionType: (submission.actionType || 'form').slice(0, 60),
        payload: submission.data || {},
        status: submission.status || 'new',
        createdAt: submission.createdAt || new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  /**
   * Save or update a knowledge item in Firestore
   */
  async saveKnowledgeItem(botId: string, item: KnowledgeBaseItem): Promise<void> {
    const path = `chatbots/${botId}/knowledge/${item.id}`;
    try {
      await setDoc(doc(db, 'chatbots', botId, 'knowledge', item.id), {
        id: item.id,
        botId,
        title: item.title.slice(0, 200),
        category: (item.category || 'general').slice(0, 60),
        type: item.type || 'text',
        content: (item.content || '').slice(0, 10000),
        tags: (item.tags || []).slice(0, 10),
        updatedAt: item.updatedAt || new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  /**
   * Delete a knowledge item from Firestore
   */
  async deleteKnowledgeItem(botId: string, itemId: string): Promise<void> {
    const path = `chatbots/${botId}/knowledge/${itemId}`;
    try {
      await deleteDoc(doc(db, 'chatbots', botId, 'knowledge', itemId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },
};
