export type ConversationStyle = 'hybrid' | 'guided' | 'ai';
export type BotStatus = 'draft' | 'published';
export type HandoffStatus = 'new' | 'awaiting_response' | 'in_progress' | 'resolved';
export type PricingMethod = 'fixed' | 'starting_at' | 'hourly' | 'custom_quote' | 'free';

export type ContentType =
  | 'information'
  | 'service_product'
  | 'faq'
  | 'gallery'
  | 'policy'
  | 'external_link'
  | 'action'
  | 'human_assistance';

export interface ActionField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'date' | 'time' | 'textarea' | 'select';
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface SubtopicContent {
  information?: {
    title: string;
    shortDescription: string;
    detailedContent: string;
    images?: string[];
    links?: { label: string; url: string }[];
  };
  serviceProduct?: {
    name: string;
    description: string;
    price: string;
    pricingMethod: PricingMethod;
    inclusions?: string[];
    exclusions?: string[];
    duration?: string;
    images?: string[];
    actionLabel?: string;
    linkedActionId?: string;
  };
  faq?: {
    question: string;
    approvedAnswer: string;
    relatedContentIds?: string[];
  };
  gallery?: {
    galleryName: string;
    images: { url: string; caption: string; category?: string }[];
    approvedPortfolioLinks?: { label: string; url: string }[];
  };
  policy?: {
    policyTitle: string;
    policyText: string;
    effectiveDate?: string;
  };
  externalLink?: {
    linkLabel: string;
    destinationUrl: string;
    description?: string;
    openInNewTab: boolean;
  };
  action?: {
    actionId: string;
    actionType: 'booking' | 'quote' | 'contact' | 'callback' | 'custom';
    title: string;
    description: string;
    fields: ActionField[];
    submitButtonText: string;
    successMessage: string;
  };
  humanAssistance?: {
    introductoryMessage: string;
    customerMessagePlaceholder: string;
    requireContactDetails: boolean;
    contactFields: ('name' | 'email' | 'phone')[];
    handoffDestination: 'email' | 'webhook' | 'dashboard_inbox';
    destinationAddress?: string;
    confirmationBehavior: string;
  };
}

export interface SubtopicItem {
  id: string;
  title: string;
  description?: string;
  order: number;
  contentType: ContentType;
  content: SubtopicContent;
}

export interface MainMenuItem {
  id: string;
  title: string;
  description: string;
  introductoryMessage?: string;
  icon: string;
  isHidden: boolean;
  order: number;
  subtopics: SubtopicItem[];
}

export interface BotAppearance {
  botDisplayName: string;
  greetingMessage: string;
  logoUrl: string;
  brandColor: string;
  accentColor: string;
  launcherPosition: 'bottom_right' | 'bottom_left';
  headerStyle: 'solid' | 'minimal' | 'gradient';
  widgetSize: 'compact' | 'standard' | 'expanded';
  welcomeScreenText: string;
}

export interface BotDeployment {
  deploymentId: string;
  isEnabled: boolean;
  allowedDomains: string[];
  embedSnippet: string;
  whatsappConfig: {
    isConnected: boolean;
    phoneNumberId?: string;
    businessAccountId?: string;
    verifyToken?: string;
    webhookUrl?: string;
    status: 'disconnected' | 'pending_verification' | 'connected';
  };
}

export interface KnowledgeBaseItem {
  id: string;
  botId: string;
  title: string;
  category: 'faq' | 'service' | 'policy' | 'general' | 'pricing' | 'hours';
  type: 'text' | 'faq' | 'service' | 'policy' | 'document' | 'link';
  content: string;
  tags: string[];
  ingestionStatus: 'ready' | 'processing' | 'error';
  updatedAt: string;
}

export interface ChatbotConfig {
  id: string;
  workspaceId: string;
  name: string;
  businessName: string;
  industry: string;
  description: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  conversationStyle: ConversationStyle;
  status: BotStatus;
  lastPublishedAt?: string;
  createdAt: string;
  updatedAt: string;
  currency?: string;
  mainMenuItems: MainMenuItem[];
  appearance: BotAppearance;
  deployment: BotDeployment;
  aiConfig: {
    model: string;
    systemPrompt: string;
    temperature: number;
    greetingMessage: string;
    fallbackMessage: string;
  };
}

export interface Workspace {
  id: string;
  name: string;
  industry: string;
  ownerEmail: string;
  createdAt: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  currentWorkspaceId: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: 'customer' | 'bot' | 'agent';
  text: string;
  timestamp: string;
  payload?: {
    type?: 'menu' | 'subtopic' | 'content' | 'action_form' | 'action_success' | 'handoff_form' | 'handoff_success' | 'ai_response';
    menuItems?: { id: string; title: string; icon?: string; description?: string }[];
    subtopics?: { id: string; title: string; description?: string; contentType: ContentType }[];
    contentView?: {
      contentType: ContentType;
      title: string;
      data: any;
    };
    actionForm?: {
      actionId: string;
      title: string;
      description: string;
      fields: ActionField[];
      submitButtonText: string;
    };
    actionSuccess?: {
      actionId: string;
      message: string;
    };
    handoffForm?: {
      introductoryMessage: string;
      customerMessagePlaceholder?: string;
      requireContactDetails: boolean;
      contactFields: ('name' | 'email' | 'phone')[];
      handoffDestination?: string;
    };
    breadcrumbs?: { label: string; menuId?: string; subtopicId?: string }[];
    sourceConfidence?: 'verified_record' | 'knowledge_base' | 'general_ai' | 'fallback';
  };
}

export interface Conversation {
  id: string;
  botId: string;
  customerSessionId: string;
  customerName?: string;
  customerContact?: string;
  startedAt: string;
  lastActivityAt: string;
  status: 'active' | 'handoff_requested' | 'resolved';
  messages: ChatMessage[];
}

export interface HumanAssistanceRequest {
  id: string;
  conversationId: string;
  botId: string;
  customerName: string;
  customerContact: string;
  message: string;
  historyExcerpt: string;
  status: HandoffStatus;
  handoffDestination: string;
  deliveryStatus: 'delivered' | 'failed' | 'pending';
  deliveryError?: string;
  assignedTo?: string;
  agentNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface ActionSubmission {
  id: string;
  actionId: string;
  actionType: string;
  actionTitle: string;
  botId: string;
  conversationId: string;
  data: Record<string, any>;
  createdAt: string;
  status: 'new' | 'reviewed' | 'contacted';
}

export interface BotAnalytics {
  totalConversations: number;
  totalMessages: number;
  totalHandoffRequests: number;
  unresolvedHandoffRequests: number;
  totalActionSubmissions: number;
  topMenuClicks: { menuId: string; title: string; count: number }[];
  conversationsByDay: { date: string; count: number }[];
  recentActivity: { id: string; type: string; description: string; timestamp: string }[];
}
