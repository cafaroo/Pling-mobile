import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/domain/core/UniqueId';
import { EventBus } from '@/infrastructure/events/EventBus';
import { TeamMessage, CreateTeamMessageProps, MessageAttachmentData, MessageMentionData } from '@/domain/team/entities/TeamMessage';
import { MessageAttachment } from '@/domain/team/value-objects/MessageAttachment';
import { MessageMention } from '@/domain/team/value-objects/MessageMention';
import { MessageReaction } from '@/domain/team/value-objects/MessageReaction';
import { TeamMessageRepository, MessageQueryOptions, MessageSearchOptions } from '@/domain/team/repositories/TeamMessageRepository';
import { SupabaseClient } from '@supabase/supabase-js';

interface MessageDataFromDb {
  id: string;
  team_id: string;
  sender_id: string;
  content: string;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  attachments?: AttachmentDataFromDb[];
  mentions?: MentionDataFromDb[];
  reactions?: ReactionDataFromDb[];
  parent_message_id?: string;
  thread_reply_count?: number;
  last_reply_at?: string;
}

interface AttachmentDataFromDb {
  id: string;
  message_id: string;
  type: 'image' | 'file' | 'link';
  url: string;
  name?: string;
  size?: number;
  mime_type?: string;
  created_at: string;
}

interface MentionDataFromDb {
  id: string;
  message_id: string;
  user_id: string;
  index: number;
  length: number;
  created_at: string;
}

interface ReactionDataFromDb {
  emoji: string;
  user_ids: string[];
}

export class SupabaseTeamMessageRepository implements TeamMessageRepository {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly eventBus: EventBus
  ) {}

  async findById(messageId: UniqueId): Promise<Result<TeamMessage, string>> {
    try {
      const { data: messageData, error: messageError } = await this.supabase
        .from('team_messages')
        .select('*, attachments:team_message_attachments(*), mentions:team_message_mentions(*), reactions:team_message_reactions(*)')
        .eq('id', messageId.toString())
        .single();

      if (messageError) {
        return err(`Kunde inte hitta meddelande: ${messageError.message}`);
      }

      if (!messageData) {
        return err(`Meddelande med ID ${messageId.toString()} hittades inte`);
      }

      // Konvertera reaktionsdata till rätt format
      const reactionsByEmoji = messageData.reactions.reduce((map, reaction) => {
        if (!map[reaction.emoji]) {
          map[reaction.emoji] = [];
        }
        map[reaction.emoji].push(reaction.user_ids);
        return map;
      }, {} as Record<string, string[]>);

      const reactionsFormatted = Object.entries(reactionsByEmoji).map(([emoji, user_ids]) => ({
        emoji,
        user_ids
      }));

      // Kombinera all data
      const completeMessageData: MessageDataFromDb = {
        ...messageData,
        attachments: messageData.attachments || [],
        mentions: messageData.mentions || [],
        reactions: reactionsFormatted || []
      };

      // Konvertera till domänentitet
      return this.mapToEntity(completeMessageData);
    } catch (error) {
      return err(`Ett fel uppstod vid hämtning av meddelande: ${error.message}`);
    }
  }

  async findByTeamId(teamId: UniqueId, options?: MessageQueryOptions): Promise<Result<TeamMessage[], string>> {
    try {
      let query = this.supabase
        .from('team_messages')
        .select('*')
        .eq('team_id', teamId.toString())
        .order('created_at', { ascending: false });

      // Applicera filter från options
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }

      if (options?.beforeId) {
        const { data: beforeMessage } = await this.supabase
          .from('team_messages')
          .select('created_at')
          .eq('id', options.beforeId)
          .single();

        if (beforeMessage) {
          query = query.lt('created_at', beforeMessage.created_at);
        }
      }

      if (options?.afterId) {
        const { data: afterMessage } = await this.supabase
          .from('team_messages')
          .select('created_at')
          .eq('id', options.afterId)
          .single();

        if (afterMessage) {
          query = query.gt('created_at', afterMessage.created_at);
        }
      }

      if (options?.startDate) {
        query = query.gte('created_at', options.startDate.toISOString());
      }

      if (options?.endDate) {
        query = query.lte('created_at', options.endDate.toISOString());
      }

      const { data: messagesData, error: messagesError } = await query;

      if (messagesError) {
        return err(`Kunde inte hämta meddelanden: ${messagesError.message}`);
      }

      if (!messagesData || messagesData.length === 0) {
        return ok([]);
      }

      // Hämta relaterad data för alla meddelanden
      const messageIds = messagesData.map(m => m.id);

      // Hämta bilagor för alla meddelanden
      const { data: attachmentsData, error: attachmentsError } = await this.supabase
        .from('team_message_attachments')
        .select('*')
        .in('message_id', messageIds);

      if (attachmentsError) {
        return err(`Kunde inte hämta bilagor: ${attachmentsError.message}`);
      }

      // Hämta omnämnanden för alla meddelanden
      const { data: mentionsData, error: mentionsError } = await this.supabase
        .from('team_message_mentions')
        .select('*')
        .in('message_id', messageIds);

      if (mentionsError) {
        return err(`Kunde inte hämta omnämnanden: ${mentionsError.message}`);
      }

      // Hämta reaktioner för alla meddelanden
      const { data: reactionsData, error: reactionsError } = await this.supabase
        .from('team_message_reactions')
        .select('message_id, emoji, user_id')
        .in('message_id', messageIds);

      if (reactionsError) {
        return err(`Kunde inte hämta reaktioner: ${reactionsError.message}`);
      }

      // Gruppera relaterad data per meddelande
      const attachmentsByMessageId = this.groupBy(attachmentsData || [], 'message_id');
      const mentionsByMessageId = this.groupBy(mentionsData || [], 'message_id');
      
      // Gruppera reaktioner per meddelande och sedan per emoji
      const reactionsByMessageId: Record<string, ReactionDataFromDb[]> = {};
      
      for (const reaction of reactionsData || []) {
        if (!reactionsByMessageId[reaction.message_id]) {
          reactionsByMessageId[reaction.message_id] = [];
        }
        
        // Hitta befintlig reaktion med samma emoji
        let existingReaction = reactionsByMessageId[reaction.message_id].find(
          r => r.emoji === reaction.emoji
        );
        
        if (!existingReaction) {
          existingReaction = { 
            emoji: reaction.emoji, 
            user_ids: [] 
          };
          reactionsByMessageId[reaction.message_id].push(existingReaction);
        }
        
        existingReaction.user_ids.push(reaction.user_id);
      }

      // Kombinera all data och mappa till domänentiteter
      const completeMessagesData = messagesData.map(message => ({
        ...message,
        attachments: attachmentsByMessageId[message.id] || [],
        mentions: mentionsByMessageId[message.id] || [],
        reactions: reactionsByMessageId[message.id] || []
      }));

      const messagesResults = await Promise.all(
        completeMessagesData.map(messageData => this.mapToEntity(messageData))
      );

      // Filtrera bort meddelanden som inte kunde mappas
      const messages = messagesResults
        .filter(result => result.isOk())
        .map(result => result.value);

      return ok(messages);
    } catch (error) {
      return err(`Ett fel uppstod vid hämtning av meddelanden: ${error.message}`);
    }
  }

  async searchMessages(teamId: UniqueId, options: MessageSearchOptions): Promise<Result<TeamMessage[], string>> {
    try {
      let query = this.supabase
        .from('team_messages')
        .select('*')
        .eq('team_id', teamId.toString())
        .ilike('content', `%${options.searchTerm}%`)
        .order('created_at', { ascending: false });

      // Applicera filter från options
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }

      // Applicera tid och datumfilter
      if (options?.startDate) {
        query = query.gte('created_at', options.startDate.toISOString());
      }

      if (options?.endDate) {
        query = query.lte('created_at', options.endDate.toISOString());
      }

      const { data: messagesData, error: messagesError } = await query;

      if (messagesError) {
        return err(`Kunde inte söka efter meddelanden: ${messagesError.message}`);
      }

      if (!messagesData || messagesData.length === 0) {
        return ok([]);
      }

      // Fortsätt på samma sätt som i findByTeamId för att hämta relaterad data
      const messageIds = messagesData.map(m => m.id);

      // Hämta bilagor för alla meddelanden
      const { data: attachmentsData, error: attachmentsError } = await this.supabase
        .from('team_message_attachments')
        .select('*')
        .in('message_id', messageIds);

      if (attachmentsError) {
        return err(`Kunde inte hämta bilagor: ${attachmentsError.message}`);
      }

      // Hämta omnämnanden för alla meddelanden
      const { data: mentionsData, error: mentionsError } = await this.supabase
        .from('team_message_mentions')
        .select('*')
        .in('message_id', messageIds);

      if (mentionsError) {
        return err(`Kunde inte hämta omnämnanden: ${mentionsError.message}`);
      }

      // Hämta reaktioner för alla meddelanden
      const { data: reactionsData, error: reactionsError } = await this.supabase
        .from('team_message_reactions')
        .select('message_id, emoji, user_id')
        .in('message_id', messageIds);

      if (reactionsError) {
        return err(`Kunde inte hämta reaktioner: ${reactionsError.message}`);
      }

      // Gruppera relaterad data per meddelande
      const attachmentsByMessageId = this.groupBy(attachmentsData || [], 'message_id');
      const mentionsByMessageId = this.groupBy(mentionsData || [], 'message_id');
      
      // Gruppera reaktioner per meddelande och sedan per emoji
      const reactionsByMessageId: Record<string, ReactionDataFromDb[]> = {};
      
      for (const reaction of reactionsData || []) {
        if (!reactionsByMessageId[reaction.message_id]) {
          reactionsByMessageId[reaction.message_id] = [];
        }
        
        // Hitta befintlig reaktion med samma emoji
        let existingReaction = reactionsByMessageId[reaction.message_id].find(
          r => r.emoji === reaction.emoji
        );
        
        if (!existingReaction) {
          existingReaction = { 
            emoji: reaction.emoji, 
            user_ids: [] 
          };
          reactionsByMessageId[reaction.message_id].push(existingReaction);
        }
        
        existingReaction.user_ids.push(reaction.user_id);
      }

      // Kombinera all data och mappa till domänentiteter
      const completeMessagesData = messagesData.map(message => ({
        ...message,
        attachments: attachmentsByMessageId[message.id] || [],
        mentions: mentionsByMessageId[message.id] || [],
        reactions: reactionsByMessageId[message.id] || []
      }));

      const messagesResults = await Promise.all(
        completeMessagesData.map(messageData => this.mapToEntity(messageData))
      );

      // Filtrera bort meddelanden som inte kunde mappas
      const messages = messagesResults
        .filter(result => result.isOk())
        .map(result => result.value);

      return ok(messages);
    } catch (error) {
      return err(`Ett fel uppstod vid sökning av meddelanden: ${error.message}`);
    }
  }

  async findMentionsForUser(userId: UniqueId, options?: MessageQueryOptions): Promise<Result<TeamMessage[], string>> {
    try {
      // Hämta meddelanden där användaren är omnämnd
      let query = this.supabase
        .from('team_message_mentions')
        .select('message_id')
        .eq('user_id', userId.toString());

      const { data: mentionsData, error: mentionsError } = await query;

      if (mentionsError) {
        return err(`Kunde inte hämta omnämnanden: ${mentionsError.message}`);
      }

      if (!mentionsData || mentionsData.length === 0) {
        return ok([]);
      }

      const messageIds = mentionsData.map(m => m.message_id);

      // Hämta meddelanden baserat på ID
      let messagesQuery = this.supabase
        .from('team_messages')
        .select('*')
        .in('id', messageIds)
        .order('created_at', { ascending: false });

      // Applicera filter från options
      if (options?.limit) {
        messagesQuery = messagesQuery.limit(options.limit);
      }

      if (options?.offset) {
        messagesQuery = messagesQuery.range(options.offset, options.offset + (options.limit || 20) - 1);
      }

      if (options?.startDate) {
        messagesQuery = messagesQuery.gte('created_at', options.startDate.toISOString());
      }

      if (options?.endDate) {
        messagesQuery = messagesQuery.lte('created_at', options.endDate.toISOString());
      }

      const { data: messagesData, error: messagesError } = await messagesQuery;

      if (messagesError) {
        return err(`Kunde inte hämta meddelanden: ${messagesError.message}`);
      }

      if (!messagesData || messagesData.length === 0) {
        return ok([]);
      }

      // Fortsätt på samma sätt som i findByTeamId för att hämta relaterad data
      const filteredMessageIds = messagesData.map(m => m.id);

      // Hämta bilagor för alla meddelanden
      const { data: attachmentsData, error: attachmentsError } = await this.supabase
        .from('team_message_attachments')
        .select('*')
        .in('message_id', filteredMessageIds);

      if (attachmentsError) {
        return err(`Kunde inte hämta bilagor: ${attachmentsError.message}`);
      }

      // Hämta omnämnanden för alla meddelanden
      const { data: allMentionsData, error: allMentionsError } = await this.supabase
        .from('team_message_mentions')
        .select('*')
        .in('message_id', filteredMessageIds);

      if (allMentionsError) {
        return err(`Kunde inte hämta omnämnanden: ${allMentionsError.message}`);
      }

      // Hämta reaktioner för alla meddelanden
      const { data: reactionsData, error: reactionsError } = await this.supabase
        .from('team_message_reactions')
        .select('message_id, emoji, user_id')
        .in('message_id', filteredMessageIds);

      if (reactionsError) {
        return err(`Kunde inte hämta reaktioner: ${reactionsError.message}`);
      }

      // Gruppera relaterad data per meddelande
      const attachmentsByMessageId = this.groupBy(attachmentsData || [], 'message_id');
      const mentionsByMessageId = this.groupBy(allMentionsData || [], 'message_id');
      
      // Gruppera reaktioner per meddelande och sedan per emoji
      const reactionsByMessageId: Record<string, ReactionDataFromDb[]> = {};
      
      for (const reaction of reactionsData || []) {
        if (!reactionsByMessageId[reaction.message_id]) {
          reactionsByMessageId[reaction.message_id] = [];
        }
        
        // Hitta befintlig reaktion med samma emoji
        let existingReaction = reactionsByMessageId[reaction.message_id].find(
          r => r.emoji === reaction.emoji
        );
        
        if (!existingReaction) {
          existingReaction = { 
            emoji: reaction.emoji, 
            user_ids: [] 
          };
          reactionsByMessageId[reaction.message_id].push(existingReaction);
        }
        
        existingReaction.user_ids.push(reaction.user_id);
      }

      // Kombinera all data och mappa till domänentiteter
      const completeMessagesData = messagesData.map(message => ({
        ...message,
        attachments: attachmentsByMessageId[message.id] || [],
        mentions: mentionsByMessageId[message.id] || [],
        reactions: reactionsByMessageId[message.id] || []
      }));

      const messagesResults = await Promise.all(
        completeMessagesData.map(messageData => this.mapToEntity(messageData))
      );

      // Filtrera bort meddelanden som inte kunde mappas
      const messages = messagesResults
        .filter(result => result.isOk())
        .map(result => result.value);

      return ok(messages);
    } catch (error) {
      return err(`Ett fel uppstod vid hämtning av omnämnanden: ${error.message}`);
    }
  }

  async save(message: TeamMessage): Promise<Result<TeamMessage, string>> {
    try {
      // Konvertera meddelande till databas-format
      const messageData = {
        id: message.id.toString(),
        team_id: message.teamId.toString(),
        sender_id: message.senderId.toString(),
        content: message.content,
        is_edited: message.isEdited,
        is_deleted: message.isDeleted,
        created_at: message.createdAt.toISOString(),
        updated_at: message.updatedAt.toISOString(),
        // Threading fields
        parent_message_id: message.parentId ? message.parentId.toString() : null,
        thread_reply_count: message.threadReplyCount,
        last_reply_at: message.lastReplyAt ? message.lastReplyAt.toISOString() : null
      };

      // Skapa eller uppdatera meddelandet
      const { data: savedMessage, error: messageError } = await this.supabase
        .from('team_messages')
        .upsert(messageData)
        .select()
        .single();

      if (messageError) {
        return err(`Kunde inte spara meddelande: ${messageError.message}`);
      }

      // Hantera bilagor
      if (message.attachments.length > 0) {
        const attachmentsData = message.attachments.map(attachment => ({
          message_id: message.id.toString(),
          type: attachment.type,
          url: attachment.url,
          name: attachment.name,
          size: attachment.size,
          mime_type: attachment.mimeType
        }));

        const { error: attachmentsError } = await this.supabase
          .from('team_message_attachments')
          .upsert(attachmentsData);

        if (attachmentsError) {
          return err(`Kunde inte spara bilagor: ${attachmentsError.message}`);
        }
      }

      // Hantera omnämnanden
      if (message.mentions.length > 0) {
        const mentionsData = message.mentions.map(mention => ({
          message_id: message.id.toString(),
          user_id: mention.userId.toString(),
          index: mention.index,
          length: mention.length
        }));

        const { error: mentionsError } = await this.supabase
          .from('team_message_mentions')
          .upsert(mentionsData);

        if (mentionsError) {
          return err(`Kunde inte spara omnämnanden: ${mentionsError.message}`);
        }
      }

      // Hantera reaktioner
      if (message.reactions.length > 0) {
        // Ta bort befintliga reaktioner för att sedan lägga till de nya
        await this.supabase
          .from('team_message_reactions')
          .delete()
          .eq('message_id', message.id.toString());

        // Skapa nya reaktioner
        const reactionsData = message.reactions.flatMap(reaction =>
          reaction.userIds.map(userId => ({
            message_id: message.id.toString(),
            emoji: reaction.emoji,
            user_id: userId.toString()
          }))
        );

        if (reactionsData.length > 0) {
          const { error: reactionsError } = await this.supabase
            .from('team_message_reactions')
            .upsert(reactionsData);

          if (reactionsError) {
            return err(`Kunde inte spara reaktioner: ${reactionsError.message}`);
          }
        }
      }

      // Publicera domänhändelser
      for (const event of message.domainEvents) {
        await this.eventBus.publish(event);
      }

      // Rensa domänhändelser efter publicering
      message.clearEvents();

      return this.findById(message.id);
    } catch (error) {
      return err(`Ett fel uppstod vid sparande av meddelande: ${error.message}`);
    }
  }

  async delete(messageId: UniqueId): Promise<Result<void, string>> {
    try {
      // Uppdatera is_deleted till true istället för att faktiskt ta bort meddelandet
      const { error } = await this.supabase
        .from('team_messages')
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('id', messageId.toString());

      if (error) {
        return err(`Kunde inte radera meddelande: ${error.message}`);
      }

      return ok(undefined);
    } catch (error) {
      return err(`Ett fel uppstod vid radering av meddelande: ${error.message}`);
    }
  }

  async getUnreadCount(teamId: UniqueId, userId: UniqueId): Promise<Result<number, string>> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_unread_message_count', {
          team_id_param: teamId.toString(),
          user_id_param: userId.toString()
        });

      if (error) {
        return err(`Kunde inte hämta antal olästa meddelanden: ${error.message}`);
      }

      return ok(data || 0);
    } catch (error) {
      return err(`Ett fel uppstod vid hämtning av antal olästa meddelanden: ${error.message}`);
    }
  }

  async markAllAsRead(teamId: UniqueId, userId: UniqueId): Promise<Result<void, string>> {
    try {
      // Uppdatera eller skapa en post för användarens lässtatus
      const { error } = await this.supabase
        .from('team_message_read_status')
        .upsert({
          team_id: teamId.toString(),
          user_id: userId.toString(),
          last_read_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        return err(`Kunde inte markera meddelanden som lästa: ${error.message}`);
      }

      return ok(undefined);
    } catch (error) {
      return err(`Ett fel uppstod vid markering av meddelanden som lästa: ${error.message}`);
    }
  }

  async update(message: TeamMessage): Promise<Result<TeamMessage, string>> {
    // Använd save-metoden för att uppdatera meddelandet
    return this.save(message);
  }

  async findByParentId(parentId: UniqueId, options?: MessageQueryOptions): Promise<Result<TeamMessage[], string>> {
    try {
      let query = this.supabase
        .from('team_messages')
        .select('*, attachments:team_message_attachments(*), mentions:team_message_mentions(*), reactions:team_message_reactions(*)')
        .eq('parent_message_id', parentId.toString())
        .order('created_at', { ascending: true });

      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }

      const { data: messagesData, error: messagesError } = await query;

      if (messagesError) {
        return err(`Kunde inte hämta trådsvar: ${messagesError.message}`);
      }

      if (!messagesData || messagesData.length === 0) {
        return ok([]);
      }

      const entities: TeamMessage[] = [];
      for (const msgData of messagesData) {
        const entityResult = await this.mapToEntity(msgData as MessageDataFromDb);
        if (entityResult.isOk()) {
          entities.push(entityResult.value);
        } else {
          console.warn(`Kunde inte mappa meddelande ${msgData.id} i tråd: ${entityResult.error}`);
        }
      }
      return ok(entities);
    } catch (error) {
      return err(`Ett fel uppstod vid hämtning av trådsvar: ${error.message}`);
    }
  }

  // Hjälpmetoder
  private async mapToEntity(data: MessageDataFromDb): Promise<Result<TeamMessage, string>> {
    try {
      const attachmentVOs = (data.attachments || []).map(att => 
        MessageAttachment.create({
          type: att.type,
          url: att.url,
          name: att.name,
          size: att.size,
          mimeType: att.mime_type
        })
      ).map(r => r.isOk() ? r.value : null).filter(vo => vo !== null) as MessageAttachment[];

      const mentionVOs = (data.mentions || []).map(men => 
        MessageMention.create({
          userId: new UniqueId(men.user_id),
          index: men.index,
          length: men.length
        })
      ).map(r => r.isOk() ? r.value : null).filter(vo => vo !== null) as MessageMention[];
      
      const reactionsGroupedByEmoji: Record<string, UniqueId[]> = {};
      if (data.reactions && Array.isArray(data.reactions)) {
        data.reactions.forEach((reactionDb: any) => {
          if (!reactionsGroupedByEmoji[reactionDb.emoji]) {
            reactionsGroupedByEmoji[reactionDb.emoji] = [];
          }
          reactionsGroupedByEmoji[reactionDb.emoji].push(new UniqueId(reactionDb.user_id));
        });
      }

      const reactionVOs = Object.entries(reactionsGroupedByEmoji).map(([emoji, userIds]) => 
        MessageReaction.create({ emoji, userIds })
      ).map(r => r.isOk() ? r.value : null).filter(vo => vo !== null) as MessageReaction[];

      const entityProps: TeamMessageProps = {
        id: new UniqueId(data.id),
        teamId: new UniqueId(data.team_id),
        senderId: new UniqueId(data.sender_id),
        content: data.content,
        attachments: attachmentVOs,
        mentions: mentionVOs,
        reactions: reactionVOs,
        isEdited: data.is_edited,
        isDeleted: data.is_deleted,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        parentId: data.parent_message_id ? new UniqueId(data.parent_message_id) : null,
        threadReplyCount: data.thread_reply_count || 0,
        lastReplyAt: data.last_reply_at ? new Date(data.last_reply_at) : null,
      };

      const messageResult = TeamMessage.create({
        id: entityProps.id.toString(),
        teamId: entityProps.teamId.toString(),
        senderId: entityProps.senderId.toString(),
        content: entityProps.content,
        attachments: entityProps.attachments.map(a => a.toData()),
        mentions: entityProps.mentions.map(m => ({ userId: m.userId.toString(), index: m.index, length: m.length })),
        parentId: entityProps.parentId?.toString(),
      });
      
      if (messageResult.isErr()) {
        return err(`Kunde inte skapa TeamMessage: ${messageResult.error}`);
      }
      
      const messageEntity = messageResult.value;
      
      (messageEntity as any).props.reactions = reactionVOs;
      (messageEntity as any).props.isEdited = entityProps.isEdited;
      (messageEntity as any).props.isDeleted = entityProps.isDeleted;
      (messageEntity as any).props.createdAt = entityProps.createdAt;
      (messageEntity as any).props.updatedAt = entityProps.updatedAt;
      (messageEntity as any).props.threadReplyCount = entityProps.threadReplyCount;
      (messageEntity as any).props.lastReplyAt = entityProps.lastReplyAt;

      return ok(messageEntity);
    } catch (error) {
      return err(`Fel vid mappning av databasdata till TeamMessage-entitet: ${error.message}`);
    }
  }

  private groupBy<T extends Record<string, any>>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((result, item) => {
      const groupKey = item[key];
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    }, {} as Record<string, T[]>);
  }
} 