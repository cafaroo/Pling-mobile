import { Result } from '@/shared/core/Result';
import { UniqueId } from '@/domain/core/UniqueId';
import { TeamMessage } from '../entities/TeamMessage';

export interface MessageQueryOptions {
  limit?: number;
  offset?: number;
  beforeId?: string;
  afterId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface MessageSearchOptions extends MessageQueryOptions {
  searchTerm: string;
}

export interface TeamMessageRepository {
  /**
   * Hämtar ett meddelande baserat på ID
   */
  findById(messageId: UniqueId): Promise<Result<TeamMessage, string>>;
  
  /**
   * Hämtar alla meddelanden för ett team
   */
  findByTeamId(teamId: UniqueId, options?: MessageQueryOptions): Promise<Result<TeamMessage[], string>>;
  
  /**
   * Söker efter meddelanden i ett team baserat på sökterm
   */
  searchMessages(teamId: UniqueId, options: MessageSearchOptions): Promise<Result<TeamMessage[], string>>;
  
  /**
   * Hämtar meddelanden som nämner en specifik användare
   */
  findMentionsForUser(userId: UniqueId, options?: MessageQueryOptions): Promise<Result<TeamMessage[], string>>;
  
  /**
   * Sparar ett nytt eller uppdaterat meddelande
   */
  save(message: TeamMessage): Promise<Result<TeamMessage, string>>;
  
  /**
   * Raderar ett meddelande (logisk radering)
   */
  delete(messageId: UniqueId): Promise<Result<void, string>>;
  
  /**
   * Hämtar antal olästa meddelanden i ett team för en användare
   */
  getUnreadCount(teamId: UniqueId, userId: UniqueId): Promise<Result<number, string>>;
  
  /**
   * Markerar alla meddelanden i ett team som lästa för en användare
   */
  markAllAsRead(teamId: UniqueId, userId: UniqueId): Promise<Result<void, string>>;
  
  /**
   * Uppdaterar ett existerande meddelande
   */
  update(message: TeamMessage): Promise<Result<TeamMessage, string>>;

  /**
   * Hämtar alla direkta svar (en tråd) till ett specifikt meddelande.
   */
  findByParentId(parentId: UniqueId, options?: MessageQueryOptions): Promise<Result<TeamMessage[], string>>;
} 