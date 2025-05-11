import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { StatisticsPeriod } from '@types/team';

/**
 * Formaterar ett datum baserat på statistikperiod
 */
export function formatDate(
  date: Date,
  period: StatisticsPeriod,
  includeTime: boolean = false
): string {
  if (!date) return '';
  
  const d = new Date(date);
  
  switch (period) {
    case StatisticsPeriod.DAILY:
      return includeTime 
        ? `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
        : `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    
    case StatisticsPeriod.WEEKLY:
      return `${d.getDate()}/${d.getMonth() + 1}`;
    
    case StatisticsPeriod.MONTHLY:
      return `${d.getDate()}/${d.getMonth() + 1}`;
    
    case StatisticsPeriod.YEARLY:
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
      return months[d.getMonth()];
    
    default:
      return includeTime 
        ? `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
        : `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }
}

/**
 * Formaterar ett datum med tid
 */
export function formatDateTime(date: Date): string {
  return format(date, 'yyyy-MM-dd HH:mm', { locale: sv });
}

/**
 * Formaterar ett datum som relativ tid (t.ex. "2 dagar sedan")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just nu';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minut' : 'minuter'} sedan`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'timme' : 'timmar'} sedan`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'dag' : 'dagar'} sedan`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} ${diffInWeeks === 1 ? 'vecka' : 'veckor'} sedan`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? 'månad' : 'månader'} sedan`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} ${diffInYears === 1 ? 'år' : 'år'} sedan`;
}

export function getStartOfPeriod(date: Date, period: StatisticsPeriod): Date {
  const result = new Date(date);
  
  switch (period) {
    case StatisticsPeriod.DAILY:
      result.setHours(0, 0, 0, 0);
      break;
      
    case StatisticsPeriod.WEEKLY:
      const day = result.getDay();
      const diff = result.getDate() - day + (day === 0 ? -6 : 1); // Justera för veckan (måndag är första dagen)
      result.setDate(diff);
      result.setHours(0, 0, 0, 0);
      break;
      
    case StatisticsPeriod.MONTHLY:
      result.setDate(1);
      result.setHours(0, 0, 0, 0);
      break;
      
    case StatisticsPeriod.YEARLY:
      result.setMonth(0, 1);
      result.setHours(0, 0, 0, 0);
      break;
  }
  
  return result;
}

export function getEndOfPeriod(date: Date, period: StatisticsPeriod): Date {
  const result = new Date(date);
  
  switch (period) {
    case StatisticsPeriod.DAILY:
      result.setHours(23, 59, 59, 999);
      break;
      
    case StatisticsPeriod.WEEKLY:
      const day = result.getDay();
      const diff = result.getDate() + (day === 0 ? 0 : 7 - day); // Justera för veckan (söndag är sista dagen)
      result.setDate(diff);
      result.setHours(23, 59, 59, 999);
      break;
      
    case StatisticsPeriod.MONTHLY:
      // Sätt till sista dagen i månaden
      result.setMonth(result.getMonth() + 1, 0);
      result.setHours(23, 59, 59, 999);
      break;
      
    case StatisticsPeriod.YEARLY:
      result.setMonth(11, 31);
      result.setHours(23, 59, 59, 999);
      break;
  }
  
  return result;
}

export function getDurationLabel(period: StatisticsPeriod): string {
  switch (period) {
    case StatisticsPeriod.DAILY:
      return 'idag';
    case StatisticsPeriod.WEEKLY:
      return 'denna vecka';
    case StatisticsPeriod.MONTHLY:
      return 'denna månad';
    case StatisticsPeriod.YEARLY:
      return 'detta år';
    default:
      return '';
  }
}

export function formatDateRange(
  startDate: Date,
  endDate: Date,
  period: StatisticsPeriod
): string {
  switch (period) {
    case StatisticsPeriod.DAILY:
      return `${formatDate(startDate, StatisticsPeriod.DAILY, true)}`;
      
    case StatisticsPeriod.WEEKLY:
      return `${formatDate(startDate, StatisticsPeriod.WEEKLY)} - ${formatDate(endDate, StatisticsPeriod.WEEKLY)}`;
      
    case StatisticsPeriod.MONTHLY:
      return `${formatDate(startDate, StatisticsPeriod.MONTHLY)} - ${formatDate(endDate, StatisticsPeriod.MONTHLY)}`;
      
    case StatisticsPeriod.YEARLY:
      return `${startDate.getFullYear()}`;
      
    default:
      return `${formatDate(startDate, period)} - ${formatDate(endDate, period)}`;
  }
} 