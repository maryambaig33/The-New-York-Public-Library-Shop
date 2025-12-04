import { GoogleGenAI, Type } from "@google/genai";
import { MOCK_PRODUCTS } from "../constants";
import { Product } from "../types";

// Initialize Gemini Client safely. 
// If API_KEY is missing during build/runtime, we fallback to empty string to allow app to render,
// though actual API calls will fail gracefully later.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

/**
 * Uses Gemini to match a natural language query to product IDs.
 */
export const searchProductsWithAI = async (query: string): Promise<string[]> => {
  try {
    const productContext = MOCK_PRODUCTS.map(p => 
      `ID: ${p.id}, Title: ${p.title}, Description: ${p.description}, Category: ${p.category}`
    ).join('\n');

    const prompt = `
      You are a search engine for the NYPL Shop. 
      Here is the product catalog:
      ${productContext}

      User Query: "${query}"

      Return a JSON object containing an array of "productIds" that match the query by semantic meaning, relevance, or vibe.
      If the query implies a gift, look for suitable items.
      Strictly return JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result.productIds || [];
  } catch (error) {
    console.error("AI Search Error:", error);
    return [];
  }
};

/**
 * Uses Gemini Vision to find products similar to an uploaded image.
 */
export const searchByImage = async (base64Image: string): Promise<string[]> => {
  try {
    const productContext = MOCK_PRODUCTS.map(p => 
        `ID: ${p.id}, Title: ${p.title}, Category: ${p.category}`
      ).join('\n');
  
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: `Look at this image. Based on its visual style, content, or vibe, which products from this list are most similar or complementary? List: ${productContext}. Return JSON with 'productIds'.` }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result.productIds || [];
  } catch (error) {
    console.error("Visual Search Error:", error);
    return [];
  }
};

/**
 * Chat with the Librarian. Returns text response and optional recommended product IDs.
 */
export const chatWithLibrarian = async (
  history: { role: 'user' | 'model'; text: string }[], 
  lastUserMessage: string
): Promise<{ text: string; productIds: string[] }> => {
  
  try {
    const productContext = MOCK_PRODUCTS.map(p => 
        `ID: ${p.id}, Title: ${p.title} ($${p.price})`
    ).join('; ');

    const systemInstruction = `
      You are the "Digital Librarian" for the New York Public Library Shop.
      Your tone is warm, literary, knowledgeable, and helpful.
      You help users find gifts, books, and souvenirs.
      
      Here is the current catalog inventory: [${productContext}]

      If you recommend a product, you MUST mention it by name.
      Additionally, at the end of your response, you MUST output a JSON block (and nothing else after it) representing the recommended product IDs if any are relevant.
      Format:
      [Your conversational response here]
      |||
      {"productIds": ["p1", "p2"]}
    `;

    // Construct the chat history for context
    // We'll simplify and just send the last interaction + context for this stateless demo, 
    // but in a real app we'd use ai.chats.create
    const prompt = `
      ${systemInstruction}

      Conversation History:
      ${history.map(h => `${h.role}: ${h.text}`).join('\n')}
      user: ${lastUserMessage}
      model:
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const fullText = response.text || "I'm having trouble checking the archives right now.";
    const parts = fullText.split('|||');
    
    let responseText = parts[0].trim();
    let productIds: string[] = [];

    if (parts.length > 1) {
      try {
        const json = JSON.parse(parts[1].trim());
        if (json.productIds) productIds = json.productIds;
      } catch (e) {
        console.error("Failed to parse hidden JSON in chat", e);
      }
    }

    return { text: responseText, productIds };

  } catch (error) {
    console.error("Chat Error:", error);
    return { text: "I apologize, but I seem to have lost my place in the catalog.", productIds: [] };
  }
};