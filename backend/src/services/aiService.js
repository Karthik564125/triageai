const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Service handling Gemini AI integration for Support Ticket Triage.
 */
class AIService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.genAI = null;
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
  }

  /**
   * Helper to get initialized generative model
   */
  getModel() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured in environment variables.');
    }
    if (!this.genAI) {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    // gemini-3.6-flash is the currently available model
    const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

    return this.genAI.getGenerativeModel({ model: modelName });
  }

  /**
   * Analyzes an existing ticket using Gemini AI and returns structured suggestions.
   *
   * @param {Object} ticket - Original ticket details
   * @param {Array<string>} availableTeams - Available support team names from Firestore
   * @returns {Promise<Object>} Validated AI triage suggestions
   */
  async analyzeTicket(ticket, availableTeams = []) {
    const model = this.getModel();

    const teamsListStr = availableTeams.length > 0
      ? availableTeams.map((t) => `- ${t}`).join('\n')
      : '- General Support';

    const systemPrompt = `You are an AI assistant for a customer support ticket triage system.

Analyze the provided customer support ticket and generate helpful suggestions.

You must not make final decisions. Your output is only a recommendation for a human support agent.

Return ONLY valid JSON with exactly this structure:

{
  "summary": "string",
  "category": "string",
  "priority": "Low | Medium | High | Critical",
  "priorityReason": "string",
  "recommendedTeam": "string",
  "suggestedResponse": "string"
}

Rules:
- Summary must be short and clear.
- Category should describe the technical/business issue.
- Priority must be based on impact and urgency.
- priorityReason must explain why that priority was selected.
- recommendedTeam should be the most appropriate available team.
- suggestedResponse must be professional, helpful, and suitable as an initial response to the customer.
- Do not invent facts that are not present in the ticket.
- Do not include markdown.
- Do not include explanations outside the JSON.
- Do not include extra fields.`;

    const userPrompt = `
Customer Ticket Information:
- Subject: ${ticket.subject || ''}
- Product/Module: ${ticket.product || 'General'}
- Description: ${ticket.description || ''}
- Customer Name: ${ticket.customerName || ''}
- Customer Email: ${ticket.customerEmail || ''}

Available Teams in System:
${teamsListStr}
`;

    const promptText = `${systemPrompt}\n\n${userPrompt}`;

    const result = await model.generateContent(promptText);
    const response = await result.response;
    const rawText = response.text();

    if (!rawText) {
      throw new Error('Empty response received from Gemini API.');
    }

    // Clean JSON formatting from Gemini (e.g., markdown ```json code blocks)
    let cleanText = rawText.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let parsed;
    try {
      parsed = JSON.parse(cleanText);
    } catch (parseError) {
      throw new Error(`Failed to parse Gemini output as JSON: ${parseError.message}`);
    }

    // Validate fields and structure
    return this.validateAIResponse(parsed, availableTeams);
  }

  /**
   * Validates and sanitizes Gemini JSON output.
   *
   * @param {Object} data
   * @param {Array<string>} availableTeams
   * @returns {Object} Validated suggestions
   */
  validateAIResponse(data, availableTeams = []) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('AI response must be a JSON object.');
    }

    const requiredFields = [
      'summary',
      'category',
      'priority',
      'priorityReason',
      'recommendedTeam',
      'suggestedResponse'
    ];

    for (const field of requiredFields) {
      if (typeof data[field] !== 'string' || !data[field].trim()) {
        throw new Error(`AI response missing required string field: '${field}'`);
      }
    }

    // Normalize and validate Priority
    const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
    const priorityNormalized = data.priority.trim();
    const matchedPriority = validPriorities.find(
      (p) => p.toLowerCase() === priorityNormalized.toLowerCase()
    );

    if (!matchedPriority) {
      throw new Error(
        `Invalid priority '${data.priority}'. Priority must be one of: Low, Medium, High, Critical.`
      );
    }

    // Normalize and validate recommendedTeam
    let recommendedTeam = data.recommendedTeam.trim();
    if (availableTeams.length > 0) {
      const teamMatch = availableTeams.find(
        (t) => t.toLowerCase() === recommendedTeam.toLowerCase()
      );
      if (teamMatch) {
        recommendedTeam = teamMatch;
      } else {
        // Fallback safely to nearest or default team if Gemini recommended an unlisted team name
        recommendedTeam = availableTeams[0];
      }
    }

    return {
      summary: data.summary.trim(),
      category: data.category.trim(),
      priority: matchedPriority,
      priorityReason: data.priorityReason.trim(),
      recommendedTeam: recommendedTeam,
      suggestedResponse: data.suggestedResponse.trim()
    };
  }
}

module.exports = new AIService();
