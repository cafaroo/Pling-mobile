import { supabase } from '@/lib/supabase';

// Exportera den befintliga supabase-instansen istället för att skapa en ny
export { supabase };

// Kommentar: Detta förhindrar skapandet av duplicerade GoTrueClient instanser
// som kan orsaka problem vid autentisering och sessionshantering. 