import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

export function formatRelativeTime(date: string | Date): string {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  
  try {
    return formatDistanceToNow(inputDate, {
      addSuffix: true,
      locale: sv
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Okänt datum';
  }
}

// Dummy component för att tillfredsställa Expo Router
export default function DateUtils() {
  return null;
} 