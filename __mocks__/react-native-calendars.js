// Mock för react-native-calendars
const React = require('react');

// Hjälpfunktion för att skapa en enkel komponent
const createMockComponent = (name) => {
  const Component = ({ children, ...props }) => {
    return React.createElement('view', {
      ...props,
      testID: props.testID || `calendar-${name}`,
      'data-component': name,
    }, children);
  };
  Component.displayName = name;
  return Component;
};

// Calendar-komponenten
const Calendar = ({ 
  current, 
  minDate, 
  maxDate, 
  markedDates, 
  onDayPress, 
  onMonthChange, 
  ...props 
}) => {
  return React.createElement('view', {
    ...props,
    testID: props.testID || 'calendar',
    'data-component': 'Calendar',
    'data-current': current,
    'data-min-date': minDate,
    'data-max-date': maxDate,
    'data-marked-dates': JSON.stringify(markedDates || {}),
    onClick: (e) => {
      if (onDayPress) {
        // Simulera ett datumval
        onDayPress({
          dateString: current || new Date().toISOString().split('T')[0],
          day: new Date().getDate(),
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          timestamp: new Date().getTime(),
        });
      }
    },
  });
};

// CalendarList-komponenten
const CalendarList = ({ 
  current, 
  minDate, 
  maxDate, 
  markedDates, 
  onDayPress, 
  onVisibleMonthsChange, 
  ...props 
}) => {
  return React.createElement('view', {
    ...props,
    testID: props.testID || 'calendar-list',
    'data-component': 'CalendarList',
    'data-current': current,
    'data-min-date': minDate,
    'data-max-date': maxDate,
    'data-marked-dates': JSON.stringify(markedDates || {}),
    onClick: (e) => {
      if (onDayPress) {
        // Simulera ett datumval
        onDayPress({
          dateString: current || new Date().toISOString().split('T')[0],
          day: new Date().getDate(),
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          timestamp: new Date().getTime(),
        });
      }
    },
  });
};

// Agenda-komponenten
const Agenda = ({ 
  items, 
  selected, 
  renderItem, 
  renderEmptyDate, 
  ...props 
}) => {
  return React.createElement('view', {
    ...props,
    testID: props.testID || 'agenda',
    'data-component': 'Agenda',
    'data-selected': selected,
    'data-items': JSON.stringify(items || {}),
  });
};

// LocaleConfig för att konfigurera datumformatet
const LocaleConfig = {
  locales: {
    'sv': {
      monthNames: [
        'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni', 
        'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
      ],
      monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'],
      dayNames: ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'],
      dayNamesShort: ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'],
      today: 'Idag'
    },
    'en': {
      monthNames: [
        'January', 'February', 'March', 'April', 'May', 'June', 
        'July', 'August', 'September', 'October', 'November', 'December'
      ],
      monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      today: 'Today'
    }
  },
  defaultLocale: 'sv'
};

// Datumhjälpare
const dateUtils = {
  addDays: (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString().split('T')[0];
  },
  
  isDateBefore: (a, b) => {
    return new Date(a) < new Date(b);
  },
  
  isDateAfter: (a, b) => {
    return new Date(a) > new Date(b);
  },
  
  formatCalendarDate: (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
};

// Exportera alla komponenter
module.exports = {
  Calendar,
  CalendarList,
  Agenda,
  LocaleConfig,
  
  // Hjälpkomponenter
  DatePicker: createMockComponent('DatePicker'),
  WeekCalendar: createMockComponent('WeekCalendar'),
  ExpandableCalendar: createMockComponent('ExpandableCalendar'),
  TimelineCalendar: createMockComponent('TimelineCalendar'),
  
  // Utils
  dateUtils,
}; 