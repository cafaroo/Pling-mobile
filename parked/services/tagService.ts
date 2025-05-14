import { supabase } from '@/lib/supabase';
import { GoalTag } from '@/types/goal';
import { ServiceResponse, handleServiceError } from './serviceUtils';

/**
 * Hämta alla tillgängliga taggar
 */
export async function getAllTags(): Promise<ServiceResponse<GoalTag[]>> {
  try {
    const { data, error } = await supabase
      .from('goal_tags')
      .select('*')
      .order('name');
      
    if (error) throw error;
    
    return {
      data: data as GoalTag[],
      error: null,
      status: 'success'
    };
  } catch (error) {
    return handleServiceError(error, 'Kunde inte hämta taggar');
  }
}

/**
 * Skapa en ny tagg
 */
export async function createTag(tag: {
  name: string;
  color: string;
}): Promise<ServiceResponse<GoalTag>> {
  try {
    const { data, error } = await supabase
      .from('goal_tags')
      .insert([{
        name: tag.name,
        color: tag.color,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      data: data as GoalTag,
      error: null,
      status: 'success'
    };
  } catch (error) {
    return handleServiceError(error, 'Kunde inte skapa tagg');
  }
}

/**
 * Uppdatera en befintlig tagg
 */
export async function updateTag(
  tagId: string,
  updates: Partial<GoalTag>
): Promise<ServiceResponse<GoalTag>> {
  try {
    const { data, error } = await supabase
      .from('goal_tags')
      .update(updates)
      .eq('id', tagId)
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      data: data as GoalTag,
      error: null,
      status: 'success'
    };
  } catch (error) {
    return handleServiceError(error, 'Kunde inte uppdatera tagg');
  }
}

/**
 * Ta bort en tagg
 */
export async function deleteTag(tagId: string): Promise<ServiceResponse<boolean>> {
  try {
    // Ta bort tagg-relationer först (kommer att kaskaderas automatiskt, men för tydlighet)
    await supabase
      .from('goal_tag_relations')
      .delete()
      .eq('tag_id', tagId);
      
    // Ta sedan bort själva taggen
    const { error } = await supabase
      .from('goal_tags')
      .delete()
      .eq('id', tagId);
      
    if (error) throw error;
    
    return {
      data: true,
      error: null,
      status: 'success'
    };
  } catch (error) {
    return handleServiceError(error, 'Kunde inte ta bort tagg');
  }
}

/**
 * Koppla taggar till ett mål
 */
export async function addTagsToGoal(
  goalId: string,
  tagIds: string[]
): Promise<ServiceResponse<boolean>> {
  try {
    if (!tagIds.length) return { data: true, error: null, status: 'success' };
    
    const tagRelations = tagIds.map(tagId => ({
      goal_id: goalId,
      tag_id: tagId
    }));
    
    const { error } = await supabase
      .from('goal_tag_relations')
      .insert(tagRelations);
      
    if (error) throw error;
    
    return {
      data: true,
      error: null,
      status: 'success'
    };
  } catch (error) {
    return handleServiceError(error, 'Kunde inte lägga till taggar till målet');
  }
}

/**
 * Ta bort tagg från ett mål
 */
export async function removeTagFromGoal(
  goalId: string,
  tagId: string
): Promise<ServiceResponse<boolean>> {
  try {
    const { error } = await supabase
      .from('goal_tag_relations')
      .delete()
      .match({ goal_id: goalId, tag_id: tagId });
      
    if (error) throw error;
    
    return {
      data: true,
      error: null,
      status: 'success'
    };
  } catch (error) {
    return handleServiceError(error, 'Kunde inte ta bort tagg från målet');
  }
}

/**
 * Uppdatera alla taggar för ett mål (tar bort existerande och lägger till nya)
 */
export async function updateGoalTags(
  goalId: string,
  tagIds: string[]
): Promise<ServiceResponse<boolean>> {
  try {
    // Ta bort alla befintliga tag-relationer för detta mål
    await supabase
      .from('goal_tag_relations')
      .delete()
      .eq('goal_id', goalId);
      
    // Om det finns nya taggar att lägga till
    if (tagIds.length > 0) {
      const tagRelations = tagIds.map(tagId => ({
        goal_id: goalId,
        tag_id: tagId
      }));
      
      const { error } = await supabase
        .from('goal_tag_relations')
        .insert(tagRelations);
        
      if (error) throw error;
    }
    
    return {
      data: true,
      error: null,
      status: 'success'
    };
  } catch (error) {
    return handleServiceError(error, 'Kunde inte uppdatera taggar för målet');
  }
} 