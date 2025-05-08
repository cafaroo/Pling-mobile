import { useCallback, useEffect, useState } from 'react';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@context/AuthContext';
import { UniqueId } from '@/domain/core/UniqueId';
import { TeamMessage } from '@/domain/team/entities/TeamMessage';
import { MessageQueryOptions, MessageSearchOptions } from '@/domain/team/repositories/TeamMessageRepository';
import { CreateTeamMessageUseCasePayload } from '../useCases/createTeamMessage';
import { CreateTeamMessageUseCase } from '../useCases/createTeamMessage';
import { supabase } from '@/lib/supabase';
import { SupabaseTeamMessageRepository } from '@/infrastructure/supabase/repositories/SupabaseTeamMessageRepository';
import { SupabaseTeamRepository } from '@/infrastructure/supabase/repositories/SupabaseTeamRepository';
import { EventBus } from '@/shared/core/EventBus';

// Singleton instance av EventBus för att dela mellan repositories
const eventBus = new EventBus();

// Funktion för att få instanser av repositories
const getRepositories = () => {
  if (!(globalThis as any).teamRepositories) {
    (globalThis as any).teamRepositories = {
      teamMessageRepository: new SupabaseTeamMessageRepository(supabase, eventBus),
      teamRepository: new SupabaseTeamRepository(supabase, eventBus)
    };
  }
  return (globalThis as any).teamRepositories;
};

export interface TeamMessageData {
  id: string;
  teamId: string;
  senderId: string;
  content: string;
  attachments: {
    type: 'image' | 'file' | 'link';
    url: string;
    name?: string;
    size?: number;
    mimeType?: string;
  }[];
  mentions: {
    userId: string;
    index: number;
    length: number;
  }[];
  reactions: {
    emoji: string;
    userIds: string[];
  }[];
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const mapTeamMessageToData = (message: TeamMessage): TeamMessageData => {
  return {
    id: message.id.toString(),
    teamId: message.teamId.toString(),
    senderId: message.senderId.toString(),
    content: message.content,
    attachments: message.attachments.map(a => ({
      type: a.type,
      url: a.url,
      name: a.name,
      size: a.size,
      mimeType: a.mimeType
    })),
    mentions: message.mentions.map(m => ({
      userId: m.userId.toString(),
      index: m.index,
      length: m.length
    })),
    reactions: message.reactions.map(r => ({
      emoji: r.emoji,
      userIds: r.userIds.map(id => id.toString())
    })),
    isEdited: message.isEdited,
    isDeleted: message.isDeleted,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt
  };
};

export interface UseTeamMessagesOptions {
  limit?: number;
  initialLoad?: boolean;
}

export function useTeamMessages(teamId: string, options: UseTeamMessagesOptions = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { teamMessageRepository, teamRepository } = getRepositories();
  
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const queryKey = ['teamMessages', teamId, searchTerm];
  const limit = options.limit || 20;
  
  // Funktion för att ladda meddelanden
  const fetchMessages = useCallback(async ({ pageParam }: { pageParam?: string }) => {
    if (!teamId) {
      return { messages: [], nextCursor: null };
    }
    
    const teamIdObj = new UniqueId(teamId);
    
    // Om det finns en sökterm, kör sökning istället
    if (searchTerm) {
      const searchOptions: MessageSearchOptions = {
        searchTerm,
        limit,
        beforeId: pageParam
      };
      
      const result = await teamMessageRepository.searchMessages(
        teamIdObj,
        searchOptions
      );
      
      if (result.isErr()) {
        throw new Error(result.unwrapErr());
      }
      
      const messages = result.unwrap();
      const mappedMessages = messages.map(mapTeamMessageToData);
      
      const nextCursor = mappedMessages.length < limit ? 
        null : 
        mappedMessages[mappedMessages.length - 1]?.id;
      
      return { 
        messages: mappedMessages, 
        nextCursor 
      };
    }
    
    // Vanlig hämtning av meddelanden
    const queryOptions: MessageQueryOptions = {
      limit,
      beforeId: pageParam
    };
    
    const result = await teamMessageRepository.findByTeamId(
      teamIdObj,
      queryOptions
    );
    
    if (result.isErr()) {
      throw new Error(result.unwrapErr());
    }
    
    const messages = result.unwrap();
    const mappedMessages = messages.map(mapTeamMessageToData);
    
    const nextCursor = mappedMessages.length < limit ? 
      null : 
      mappedMessages[mappedMessages.length - 1]?.id;
    
    if (mappedMessages.length > 0) {
      setLastMessageId(mappedMessages[mappedMessages.length - 1].id);
    }
    
    return { 
      messages: mappedMessages, 
      nextCursor 
    };
  }, [teamId, teamMessageRepository, limit, searchTerm]);
  
  // Huvudquery för meddelanden
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: fetchMessages,
    enabled: !!teamId && !!user && options.initialLoad !== false,
    staleTime: 1000 * 60, // 1 minut
    refetchOnWindowFocus: true
  });
  
  // Ladda fler meddelanden
  const loadMore = useCallback(async () => {
    if (hasMoreMessages && !loadingMore && lastMessageId) {
      setLoadingMore(true);
      try {
        await fetchNextPage({ pageParam: lastMessageId });
        setHasMoreMessages(hasNextPage ?? false);
      } finally {
        setLoadingMore(false);
      }
    }
  }, [fetchNextPage, hasMoreMessages, hasNextPage, lastMessageId, loadingMore]);
  
  // Skapa meddelande
  const createTeamMessageUseCase = new CreateTeamMessageUseCase(
    teamMessageRepository,
    teamRepository
  );
  
  const { mutate: sendMessage, isLoading: isSending } = useMutation({
    mutationFn: async (payload: CreateTeamMessageUseCasePayload) => {
      const result = await createTeamMessageUseCase.execute(payload);
      if (result.isErr()) {
        throw new Error(result.unwrapErr());
      }
      return mapTeamMessageToData(result.unwrap());
    },
    onSuccess: (newMessage) => {
      // Uppdatera cache med nytt meddelande
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData || !oldData.pages || oldData.pages.length === 0) {
          return {
            pages: [{ messages: [newMessage], nextCursor: null }],
            pageParams: [undefined]
          };
        }
        
        // Lägg till det nya meddelandet först i listan
        const newPages = [...oldData.pages];
        newPages[0] = {
          ...newPages[0],
          messages: [newMessage, ...newPages[0].messages]
        };
        
        return {
          ...oldData,
          pages: newPages
        };
      });
      
      // Markera meddelanden som lästa för den aktuella användaren
      if (user?.id) {
        markMessagesAsRead();
      }
    }
  });
  
  // Redigera meddelande
  const { mutate: editMessage, isLoading: isEditing } = useMutation({
    mutationFn: async ({
      messageId,
      content
    }: {
      messageId: string;
      content: string;
    }) => {
      const messageIdObj = new UniqueId(messageId);
      const result = await teamMessageRepository.findById(messageIdObj);
      
      if (result.isErr()) {
        throw new Error(result.unwrapErr());
      }
      
      const message = result.unwrap();
      
      if (message.senderId.toString() !== user?.id) {
        throw new Error('Du kan inte redigera någon annans meddelande');
      }
      
      const editResult = message.editContent(content);
      if (editResult.isErr()) {
        throw new Error(editResult.unwrapErr());
      }
      
      const saveResult = await teamMessageRepository.update(message);
      if (saveResult.isErr()) {
        throw new Error(saveResult.unwrapErr());
      }
      
      return mapTeamMessageToData(saveResult.unwrap());
    },
    onSuccess: (updatedMessage) => {
      // Uppdatera meddelandet i cache
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;
        
        const newPages = oldData.pages.map((page: any) => {
          const newMessages = page.messages.map((msg: TeamMessageData) => 
            msg.id === updatedMessage.id ? updatedMessage : msg
          );
          
          return {
            ...page,
            messages: newMessages
          };
        });
        
        return {
          ...oldData,
          pages: newPages
        };
      });
    }
  });
  
  // Radera meddelande
  const { mutate: deleteMessage, isLoading: isDeleting } = useMutation({
    mutationFn: async (messageId: string) => {
      const messageIdObj = new UniqueId(messageId);
      const result = await teamMessageRepository.findById(messageIdObj);
      
      if (result.isErr()) {
        throw new Error(result.unwrapErr());
      }
      
      const message = result.unwrap();
      
      // Kontrollera behörighet
      if (message.senderId.toString() !== user?.id) {
        throw new Error('Du kan inte radera någon annans meddelande');
      }
      
      const deleteResult = message.markAsDeleted();
      if (deleteResult.isErr()) {
        throw new Error(deleteResult.unwrapErr());
      }
      
      const saveResult = await teamMessageRepository.update(message);
      if (saveResult.isErr()) {
        throw new Error(saveResult.unwrapErr());
      }
      
      return messageId;
    },
    onSuccess: (messageId) => {
      // Uppdatera meddelandet i cache
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;
        
        const newPages = oldData.pages.map((page: any) => {
          const newMessages = page.messages.map((msg: TeamMessageData) => {
            if (msg.id === messageId) {
              return { ...msg, isDeleted: true, content: 'Meddelandet har raderats' };
            }
            return msg;
          });
          
          return {
            ...page,
            messages: newMessages
          };
        });
        
        return {
          ...oldData,
          pages: newPages
        };
      });
    }
  });
  
  // Reagera på meddelande
  const { mutate: reactToMessage, isLoading: isReacting } = useMutation({
    mutationFn: async ({
      messageId,
      emoji,
      add = true
    }: {
      messageId: string;
      emoji: string;
      add?: boolean;
    }) => {
      const messageIdObj = new UniqueId(messageId);
      const result = await teamMessageRepository.findById(messageIdObj);
      
      if (result.isErr()) {
        throw new Error(result.unwrapErr());
      }
      
      const message = result.unwrap();
      const userId = user?.id;
      
      if (!userId) {
        throw new Error('Användare inte inloggad');
      }
      
      let actionResult;
      
      if (add) {
        actionResult = message.addReaction({
          emoji,
          userId
        });
      } else {
        actionResult = message.removeReaction({
          emoji,
          userId
        });
      }
      
      if (actionResult.isErr()) {
        throw new Error(actionResult.unwrapErr());
      }
      
      const saveResult = await teamMessageRepository.update(message);
      if (saveResult.isErr()) {
        throw new Error(saveResult.unwrapErr());
      }
      
      return mapTeamMessageToData(saveResult.unwrap());
    },
    onSuccess: (updatedMessage) => {
      // Uppdatera meddelandet i cache
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;
        
        const newPages = oldData.pages.map((page: any) => {
          const newMessages = page.messages.map((msg: TeamMessageData) => 
            msg.id === updatedMessage.id ? updatedMessage : msg
          );
          
          return {
            ...page,
            messages: newMessages
          };
        });
        
        return {
          ...oldData,
          pages: newPages
        };
      });
    }
  });
  
  // Markera meddelanden som lästa
  const { mutate: markMessagesAsRead } = useMutation({
    mutationFn: async () => {
      if (!user?.id || !teamId) return;
      
      const userId = new UniqueId(user.id);
      const teamIdObj = new UniqueId(teamId);
      
      const result = await teamMessageRepository.markAllAsRead(teamIdObj, userId);
      if (result.isErr()) {
        throw new Error(result.unwrapErr());
      }
      
      return true;
    }
  });
  
  // Hämta antal olästa meddelanden
  const {
    data: unreadCount,
    isLoading: isLoadingUnreadCount,
    refetch: refetchUnreadCount
  } = useQuery({
    queryKey: ['unreadMessages', teamId, user?.id],
    queryFn: async () => {
      if (!user?.id || !teamId) return 0;
      
      const userId = new UniqueId(user.id);
      const teamIdObj = new UniqueId(teamId);
      
      const result = await teamMessageRepository.getUnreadCount(teamIdObj, userId);
      if (result.isErr()) {
        throw new Error(result.unwrapErr());
      }
      
      return result.unwrap();
    },
    enabled: !!teamId && !!user?.id,
    staleTime: 1000 * 30 // 30 sekunder
  });
  
  // Lyssna på realtidsuppdateringar
  useEffect(() => {
    if (!teamId) return;
    
    const teamIdStr = teamId.toString();
    let subscription: any = null;
    
    const setupRealtime = async () => {
      // Lyssna på nya meddelanden
      subscription = supabase
        .channel(`team_messages:${teamIdStr}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'team_messages',
          filter: `team_id=eq.${teamIdStr}`
        }, (payload) => {
          // Ignorera uppdateringar orsakade av den aktuella användaren
          if (payload.new.sender_id === user?.id) return;
          
          // Hämta nya meddelandet med alla relaterade data
          const messageId = new UniqueId(payload.new.id);
          teamMessageRepository.findById(messageId)
            .then(result => {
              if (result.isOk()) {
                const newMessage = mapTeamMessageToData(result.unwrap());
                
                // Uppdatera cache med det nya meddelandet
                queryClient.setQueryData(queryKey, (oldData: any) => {
                  if (!oldData || !oldData.pages || oldData.pages.length === 0) {
                    return {
                      pages: [{ messages: [newMessage], nextCursor: null }],
                      pageParams: [undefined]
                    };
                  }
                  
                  // Kontrollera om meddelandet redan finns
                  let messageExists = false;
                  oldData.pages.forEach((page: any) => {
                    page.messages.forEach((msg: TeamMessageData) => {
                      if (msg.id === newMessage.id) {
                        messageExists = true;
                      }
                    });
                  });
                  
                  if (messageExists) return oldData;
                  
                  // Lägg till det nya meddelandet först i listan
                  const newPages = [...oldData.pages];
                  newPages[0] = {
                    ...newPages[0],
                    messages: [newMessage, ...newPages[0].messages]
                  };
                  
                  return {
                    ...oldData,
                    pages: newPages
                  };
                });
                
                // Uppdatera antal olästa meddelanden
                refetchUnreadCount();
              }
            });
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'team_messages',
          filter: `team_id=eq.${teamIdStr}`
        }, (payload) => {
          // Hämta uppdaterade meddelandet med alla relaterade data
          const messageId = new UniqueId(payload.new.id);
          teamMessageRepository.findById(messageId)
            .then(result => {
              if (result.isOk()) {
                const updatedMessage = mapTeamMessageToData(result.unwrap());
                
                // Uppdatera meddelandet i cache
                queryClient.setQueryData(queryKey, (oldData: any) => {
                  if (!oldData || !oldData.pages) return oldData;
                  
                  const newPages = oldData.pages.map((page: any) => {
                    const newMessages = page.messages.map((msg: TeamMessageData) => 
                      msg.id === updatedMessage.id ? updatedMessage : msg
                    );
                    
                    return {
                      ...page,
                      messages: newMessages
                    };
                  });
                  
                  return {
                    ...oldData,
                    pages: newPages
                  };
                });
              }
            });
        })
        .subscribe();
    };
    
    setupRealtime();
    
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [teamId, user?.id, queryClient, queryKey, teamMessageRepository, refetchUnreadCount]);
  
  // När användaren öppnar teamets meddelandevy, markera alla som lästa
  useEffect(() => {
    if (teamId && user?.id && options.initialLoad !== false) {
      markMessagesAsRead();
    }
  }, [teamId, user?.id, markMessagesAsRead, options.initialLoad]);
  
  // Sammanställ meddelanden från alla sidor
  const messages = (data?.pages || []).flatMap(page => page.messages || []);
  
  return {
    messages,
    isLoading,
    isError,
    error,
    loadMore,
    hasMoreMessages,
    loadingMore,
    refetch,
    sendMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
    unreadCount: unreadCount || 0,
    isLoadingUnreadCount,
    isSending,
    isEditing,
    isDeleting,
    isReacting,
    markMessagesAsRead,
    searchTerm,
    setSearchTerm
  };
} 