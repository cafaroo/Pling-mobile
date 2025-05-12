import { ResourceCountProvider } from '@/domain/organization/services/AutomaticResourceTrackingService';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Implementation av ResourceCountProvider som använder Supabase för att hämta resursanvändning.
 */
export class SupabaseResourceCountProvider implements ResourceCountProvider {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Hämtar antal mål för en organisation.
   */
  async getGoalCount(organizationId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('goals')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);
      
      if (error) throw error;
      
      return count || 0;
    } catch (error) {
      console.error('Fel vid hämtning av målantal:', error);
      return 0;
    }
  }

  /**
   * Hämtar antal tävlingar för en organisation.
   */
  async getCompetitionCount(organizationId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('competitions')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);
      
      if (error) throw error;
      
      return count || 0;
    } catch (error) {
      console.error('Fel vid hämtning av tävlingsantal:', error);
      return 0;
    }
  }

  /**
   * Hämtar antal rapporter för en organisation.
   */
  async getReportCount(organizationId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);
      
      if (error) throw error;
      
      return count || 0;
    } catch (error) {
      console.error('Fel vid hämtning av rapportantal:', error);
      return 0;
    }
  }

  /**
   * Hämtar antal dashboards för en organisation.
   */
  async getDashboardCount(organizationId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('dashboards')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);
      
      if (error) throw error;
      
      return count || 0;
    } catch (error) {
      console.error('Fel vid hämtning av dashboardantal:', error);
      return 0;
    }
  }

  /**
   * Hämtar mediaanvändning för en organisation i MB.
   * Beräknar användning baserat på storleken för alla uppladdade filer.
   */
  async getMediaUsage(organizationId: string): Promise<number> {
    try {
      // Hämta filer från storage som tillhör organisationen
      const { data, error } = await this.supabase
        .from('media_files')
        .select('size_bytes')
        .eq('organization_id', organizationId);
      
      if (error) throw error;
      
      // Summera storleken på alla filer och konvertera till MB
      const totalBytes = data.reduce((sum, file) => sum + (file.size_bytes || 0), 0);
      const totalMB = Math.ceil(totalBytes / (1024 * 1024));
      
      return totalMB;
    } catch (error) {
      console.error('Fel vid hämtning av mediaanvändning:', error);
      return 0;
    }
  }
  
  /**
   * Hämtar användning för alla resurstyper i en organisation.
   */
  async getAllResourceCounts(organizationId: string): Promise<{
    goals: number;
    competitions: number;
    reports: number;
    dashboards: number;
    mediaUsage: number;
  }> {
    // För prestandans skull hämtar vi allt i parallell
    const [
      goals,
      competitions,
      reports,
      dashboards,
      mediaUsage
    ] = await Promise.all([
      this.getGoalCount(organizationId),
      this.getCompetitionCount(organizationId),
      this.getReportCount(organizationId),
      this.getDashboardCount(organizationId),
      this.getMediaUsage(organizationId)
    ]);
    
    return {
      goals,
      competitions,
      reports,
      dashboards,
      mediaUsage
    };
  }
} 