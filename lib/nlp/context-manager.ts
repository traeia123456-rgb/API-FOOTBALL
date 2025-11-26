/**
 * Conversation Context Manager
 * Maintains context across multiple queries in a conversation
 */

interface ContextState {
  lastTeam?: string;
  lastLeague?: string;
  lastPlayer?: string;
  lastIntent?: string;
  queryHistory: string[];
  entityHistory: Map<string, any>;
}

class ConversationContext {
  private context: ContextState;
  private maxHistorySize: number = 10;

  constructor() {
    this.context = {
      queryHistory: [],
      entityHistory: new Map()
    };
  }

  /**
   * Update context with new query information
   */
  updateContext(query: string, entities: any, intent: string) {
    // Add to query history
    this.context.queryHistory.unshift(query);
    if (this.context.queryHistory.length > this.maxHistorySize) {
      this.context.queryHistory.pop();
    }

    // Update last entities
    if (entities.team) {
      this.context.lastTeam = entities.team;
      this.context.entityHistory.set('team', entities.team);
    }
    if (entities.league) {
      this.context.lastLeague = entities.league;
      this.context.entityHistory.set('league', entities.league);
    }
    if (entities.player) {
      this.context.lastPlayer = entities.player;
      this.context.entityHistory.set('player', entities.player);
    }

    this.context.lastIntent = intent;
  }

  /**
   * Resolve references in query using context
   */
  resolveReferences(query: string, entities: any): any {
    const lowerQuery = query.toLowerCase();
    const resolved = { ...entities };

    // Handle pronouns and references
    const pronouns = ['él', 'ella', 'ellos', 'ese', 'esa', 'esos', 'mismo', 'misma'];
    const hasPronouns = pronouns.some(p => lowerQuery.includes(p));

    if (hasPronouns || lowerQuery.includes('también') || lowerQuery.includes('tambien')) {
      // Use last mentioned team if no team specified
      if (!resolved.team && this.context.lastTeam) {
        resolved.team = this.context.lastTeam;
      }
      // Use last mentioned league if no league specified
      if (!resolved.league && this.context.lastLeague) {
        resolved.league = this.context.lastLeague;
      }
      // Use last mentioned player if no player specified
      if (!resolved.player && this.context.lastPlayer) {
        resolved.player = this.context.lastPlayer;
      }
    }

    // Handle follow-up questions
    const followUpPhrases = ['y ahora', 'ahora', 'y los', 'y las', 'qué tal', 'que tal'];
    const isFollowUp = followUpPhrases.some(p => lowerQuery.startsWith(p));

    if (isFollowUp) {
      // Inherit context from previous query
      if (!resolved.team && this.context.lastTeam) {
        resolved.team = this.context.lastTeam;
      }
      if (!resolved.league && this.context.lastLeague) {
        resolved.league = this.context.lastLeague;
      }
    }

    return resolved;
  }

  /**
   * Get last mentioned entity of a type
   */
  getLastEntity(type: string): any {
    return this.context.entityHistory.get(type);
  }

  /**
   * Check if query is a follow-up
   */
  isFollowUp(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    const followUpIndicators = [
      'y ahora',
      'ahora muestra',
      'y los',
      'y las',
      'también',
      'tambien',
      'qué tal',
      'que tal',
      'y el',
      'y la'
    ];

    return followUpIndicators.some(indicator => lowerQuery.startsWith(indicator));
  }

  /**
   * Get query history
   */
  getHistory(): string[] {
    return [...this.context.queryHistory];
  }

  /**
   * Clear context
   */
  clear() {
    this.context = {
      queryHistory: [],
      entityHistory: new Map()
    };
  }

  /**
   * Get full context state
   */
  getState(): ContextState {
    return { ...this.context };
  }
}

// Export singleton instance
export const conversationContext = new ConversationContext();
