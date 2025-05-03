import { format, formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

/**
 * Formaterar ett datum relativt till nuvarande tid på svenska
 * @param date - ISO-datumsträngen att formatera
 * @returns Formaterad tidstext på svenska (t.ex. "2 timmar sedan" eller "14:30")
 */
export function formatRelativeTime(date: string): string {
  const now = new Date();
  const messageDate = new Date(date);
  
  // Om meddelandet är från idag, visa relativ tid
  if (messageDate.toDateString() === now.toDateString()) {
    return formatDistanceToNow(messageDate, { 
      addSuffix: true,
      locale: sv 
    });
  }
  
  // Annars visa datum och tid
  return format(messageDate, 'PPp', { locale: sv });
}

const dateUtils = {
  formatRelativeTime,
};

export default dateUtils; 