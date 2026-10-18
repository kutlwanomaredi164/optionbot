import { GoogleGenAI } from '@google/genai';
import { ChatbotConfig, KnowledgeBaseItem } from '../src/types';
import dotenv from 'dotenv';

dotenv.config();

let genAIClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

export function retrieveRelevantKnowledge(
  query: string,
  knowledgeList: KnowledgeBaseItem[],
  maxResults = 4
): KnowledgeBaseItem[] {
  if (!knowledgeList || knowledgeList.length === 0) return [];
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\W+/).filter((w) => w.length > 2);

  const scored = knowledgeList.map((item) => {
    let score = 0;
    const titleLower = item.title.toLowerCase();
    const contentLower = item.content.toLowerCase();
    const tagsLower = (item.tags || []).map((t) => t.toLowerCase()).join(' ');

    queryWords.forEach((word) => {
      if (titleLower.includes(word)) score += 5;
      if (tagsLower.includes(word)) score += 4;
      if (contentLower.includes(word)) score += 2;
    });

    if (titleLower === queryLower) score += 10;
    return { item, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((s) => s.item);
}

export function extractStructuredBusinessCatalog(bot: ChatbotConfig): string {
  const catalogLines: string[] = [];
  catalogLines.push(`Business Name: ${bot.businessName}`);
  catalogLines.push(`Industry: ${bot.industry}`);
  catalogLines.push(`Description: ${bot.description}`);
  if (bot.website) catalogLines.push(`Website: ${bot.website}`);
  if (bot.contactEmail) catalogLines.push(`Email: ${bot.contactEmail}`);
  if (bot.contactPhone) catalogLines.push(`Phone: ${bot.contactPhone}`);

  catalogLines.push('\n-- Main Menu & Services Catalog --');
  bot.mainMenuItems.forEach((menu) => {
    if (menu.isHidden) return;
    catalogLines.push(`\n[Category: ${menu.title}] - ${menu.description}`);
    menu.subtopics.forEach((sub) => {
      catalogLines.push(`  • ${sub.title} (${sub.contentType}):`);
      if (sub.content.serviceProduct) {
        const sp = sub.content.serviceProduct;
        catalogLines.push(`    - Product/Service: ${sp.name}`);
        catalogLines.push(`    - Price: ${sp.price} (${sp.pricingMethod})`);
        if (sp.duration) catalogLines.push(`    - Duration: ${sp.duration}`);
        if (sp.inclusions && sp.inclusions.length) {
          catalogLines.push(`    - Inclusions: ${sp.inclusions.join('; ')}`);
        }
        if (sp.exclusions && sp.exclusions.length) {
          catalogLines.push(`    - Exclusions: ${sp.exclusions.join('; ')}`);
        }
      } else if (sub.content.information) {
        catalogLines.push(`    - Info: ${sub.content.information.shortDescription}`);
        catalogLines.push(`    - Details: ${sub.content.information.detailedContent}`);
      } else if (sub.content.faq) {
        catalogLines.push(`    - Q: ${sub.content.faq.question}`);
        catalogLines.push(`    - Approved A: ${sub.content.faq.approvedAnswer}`);
      } else if (sub.content.policy) {
        catalogLines.push(`    - Policy: ${sub.content.policy.policyTitle}`);
        catalogLines.push(`    - Details: ${sub.content.policy.policyText}`);
      }
    });
  });

  return catalogLines.join('\n');
}

export async function generateAIResponse(
  bot: ChatbotConfig,
  userMessage: string,
  relevantKnowledge: KnowledgeBaseItem[],
  conversationHistory: { role: 'user' | 'model'; text: string }[] = []
): Promise<{ text: string; sourceConfidence: 'verified_record' | 'knowledge_base' | 'general_ai' | 'fallback' }> {
  const client = getAIClient();

  if (!client) {
    // Graceful fallback when Gemini API key is not configured or in test mode
    return generateFallbackResponse(bot, userMessage, relevantKnowledge);
  }

  try {
    const catalog = extractStructuredBusinessCatalog(bot);
    const knowledgeSnippets = relevantKnowledge
      .map((k) => `[Knowledge Source: ${k.title} (${k.category})]\n${k.content}`)
      .join('\n\n');

    const systemInstruction = `You are the official conversational AI assistant for "${bot.businessName}", an establishment in the "${bot.industry}" industry.
Your tone is professional, welcoming, concise, and helpful.

BUSINESS CONTEXT:
${catalog}

${knowledgeSnippets ? `RELEVANT VERIFIED KNOWLEDGE BASE ENTRIES:\n${knowledgeSnippets}\n` : ''}

CRITICAL RULES:
1. Always base answers strictly on the business details, menu catalog, and knowledge base provided above.
2. NEVER invent, fabricate, or assume prices, availability, opening hours, or policies not stated in the context.
3. Keep responses concise, clear, and scannable (1-3 brief paragraphs).
4. If the customer asks for a bespoke service, quotation, or needs human assistance, encourage them to select the "Talk to a Person" option or submit their enquiry.
5. If the exact answer cannot be determined from the context, state politely what is available and suggest connecting with the team or checking the menu categories.
`;

    // Take the last 6 messages of conversation context
    const recentHistory = conversationHistory.slice(-6).map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));

    const contents = [
      ...recentHistory,
      {
        role: 'user',
        parts: [{ text: userMessage }],
      },
    ];

    const response = await client.models.generateContent({
      model: bot.aiConfig.model || 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: bot.aiConfig.temperature || 0.3,
      },
    });

    const reply = response.text?.trim();
    if (reply) {
      const confidence = relevantKnowledge.length > 0 ? 'knowledge_base' : 'verified_record';
      return { text: reply, sourceConfidence: confidence };
    }

    return generateFallbackResponse(bot, userMessage, relevantKnowledge);
  } catch (error) {
    console.error('Error in Gemini generateContent:', error);
    return generateFallbackResponse(bot, userMessage, relevantKnowledge);
  }
}

function generateFallbackResponse(
  bot: ChatbotConfig,
  userMessage: string,
  relevantKnowledge: KnowledgeBaseItem[]
): { text: string; sourceConfidence: 'verified_record' | 'knowledge_base' | 'general_ai' | 'fallback' } {
  // If we have relevant verified knowledge, return the direct approved content
  if (relevantKnowledge.length > 0) {
    const topDoc = relevantKnowledge[0];
    return {
      text: `${topDoc.content}\n\nFeel free to explore our menu options below or leave a message for our team.`,
      sourceConfidence: 'knowledge_base',
    };
  }

  // Check if user is asking about services, prices, or contact
  const lower = userMessage.toLowerCase();
  for (const menu of bot.mainMenuItems) {
    if (lower.includes(menu.title.toLowerCase()) || menu.title.toLowerCase().split(' ').some((w) => lower.includes(w))) {
      return {
        text: `Here are our options for ${menu.title}. Please tap on any item below to explore details, pricing, and availability.`,
        sourceConfidence: 'verified_record',
      };
    }
  }

  return {
    text: `Thanks for reaching out to ${bot.businessName}! I can assist you with our services, pricing, and policies. Please choose an option from the menu below or tap "Talk to a Person" if you would like our team to get back to you directly.`,
    sourceConfidence: 'fallback',
  };
}
