import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { EventBus } from '@/infrastructure/events/EventBus';
import { type Database } from '@/types/supabase';

// Skapa en mock-EventBus för testning
class MockEventBus implements EventBus {
  private events: any[] = [];

  async publish(event: any): Promise<void> {
    this.events.push(event);
  }

  getEvents(): any[] {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }
}

/**
 * Skapar en testmiljö för infrastrukturtester
 * 
 * Denna funktion skapar:
 * - En Supabase-klient som ansluter till testmiljön
 * - En mock av EventBus för testning
 * 
 * @returns Ett objekt med testmiljön
 */
export async function setup() {
  // Använd test-URL och API-nyckel
  const supabaseUrl = process.env.SUPABASE_TEST_URL || 'http://localhost:54321';
  const supabaseKey = process.env.SUPABASE_TEST_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
  
  // Skapa Supabase-klient
  const supabase = createClient<Database>(supabaseUrl, supabaseKey);
  
  // Skapa mock av EventBus
  const eventBus = new MockEventBus();
  
  return {
    supabase,
    eventBus
  };
}

/**
 * Städar upp efter testerna
 */
export async function teardown() {
  // Rensa testdata om nödvändigt
  // Detta beror på vilken strategi som används för testning
  // I en isolerad testmiljö (CI) kan det vara okej att lämna data
  // I en delad testmiljö kan det vara bra att rensa efter sig
}

/**
 * Hjälpfunktion för att generera unika test-ID:n
 */
export function generateTestId(prefix = 'test'): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

/**
 * Hjälpfunktion för att rensa testdata i en specifik tabell
 */
export async function clearTestData(supabase: SupabaseClient, table: string, idField = 'id', idPrefix = 'test_') {
  await supabase
    .from(table)
    .delete()
    .like(idField, `${idPrefix}%`);
} 