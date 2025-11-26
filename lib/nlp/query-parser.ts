/**
 * Query Parser - Main entry point for NLP processing
 * Orchestrates entity extraction, intent detection, and context management
 */

import { extractEntities, ExtractedEntities } from './entity-extractor';
import { detectIntent, IntentResult } from './intent-detector';
import { conversationContext } from './context-manager';

export interface ParsedQuery {
  original: string;
  intent: IntentResult;
  entities: ExtractedEntities;
  isFollowUp: boolean;
}

/**
 * Parse a natural language query
 */
export function parseNaturalLanguageQuery(query: string): ParsedQuery {
  // 1. Extract entities from current query
  let entities = extractEntities(query);

  // 2. Check context for follow-up resolution
  const isFollowUp = conversationContext.isFollowUp(query);
  
  // 3. Resolve references (merge with context)
  // If it's a follow-up or contains pronouns, fill gaps from context
  entities = conversationContext.resolveReferences(query, entities);

  // 4. Detect intent based on resolved entities
  const intent = detectIntent(query, entities);

  // 5. Update context for future queries
  conversationContext.updateContext(query, entities, intent.primary);

  return {
    original: query,
    intent,
    entities,
    isFollowUp
  };
}
