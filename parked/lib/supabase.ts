/**
 * FÖRÅLDRAD FIL - Använd @/lib/supabase istället
 * Denna fil finns endast för bakåtkompatibilitet
 */

// Re-exportera från den rätta platsen för att förhindra dublettinstanser
import { supabase } from '@/lib/supabase';

// Exportera både som named export och default export för bakåtkompatibilitet
export { supabase };
export default supabase;

// Exportera även typade hjälpfunktioner
export const getTypedTable = <T extends string>(table: T) => supabase.from(table);
export const getTypedView = <T extends string>(view: T) => supabase.from(view);

// OBS: Denna fil är markerad för borttagning i framtiden.
// Uppdatera dina importer att använda @/lib/supabase direkt istället. 