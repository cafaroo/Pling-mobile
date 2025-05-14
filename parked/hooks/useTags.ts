import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GoalTag } from '@/types/goal';
import { 
  getAllTags, 
  createTag, 
  updateTag, 
  deleteTag,
  addTagsToGoal,
  removeTagFromGoal,
  updateGoalTags
} from '@/services/tagService';

/**
 * Hook för att hämta alla taggar
 */
export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await getAllTags();
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data || [];
    }
  });
}

/**
 * Hook för att skapa en ny tagg
 */
export function useCreateTag() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (tag: { name: string; color: string }) => {
      const response = await createTag(tag);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    }
  });
}

/**
 * Hook för att uppdatera en befintlig tagg
 */
export function useUpdateTag() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<GoalTag> 
    }) => {
      const response = await updateTag(id, updates);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      // Även ogiltigförklara alla mål eftersom de kan ha denna tagg
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  });
}

/**
 * Hook för att ta bort en tagg
 */
export function useDeleteTag() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (tagId: string) => {
      const response = await deleteTag(tagId);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      // Även ogiltigförklara alla mål eftersom de kan ha denna tagg
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  });
}

/**
 * Hook för att lägga till taggar på ett mål
 */
export function useAddTagsToGoal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      goalId, 
      tagIds 
    }: { 
      goalId: string; 
      tagIds: string[] 
    }) => {
      const response = await addTagsToGoal(goalId, tagIds);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Ogiltigförklara det specifika målet
      queryClient.invalidateQueries({ queryKey: ['goal', variables.goalId] });
      // Också ogiltigförklara allmänna mål-queriesar
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  });
}

/**
 * Hook för att ta bort en tagg från ett mål
 */
export function useRemoveTagFromGoal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      goalId, 
      tagId 
    }: { 
      goalId: string; 
      tagId: string 
    }) => {
      const response = await removeTagFromGoal(goalId, tagId);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Ogiltigförklara det specifika målet
      queryClient.invalidateQueries({ queryKey: ['goal', variables.goalId] });
      // Också ogiltigförklara allmänna mål-queriesar
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  });
}

/**
 * Hook för att uppdatera alla taggar för ett mål
 */
export function useUpdateGoalTags() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      goalId, 
      tagIds 
    }: { 
      goalId: string; 
      tagIds: string[] 
    }) => {
      const response = await updateGoalTags(goalId, tagIds);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Ogiltigförklara det specifika målet
      queryClient.invalidateQueries({ queryKey: ['goal', variables.goalId] });
      // Också ogiltigförklara allmänna mål-queriesar
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  });
} 