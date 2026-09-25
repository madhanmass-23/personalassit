export const mockUser = {
  id: '1',
  name: 'Alex',
  email: 'alex@example.com',
  avatar: '/avatar.png',
};

export const mockTasks = [
  {
    id: 't1',
    title: 'Review weekly budget',
    time: '10:00 AM',
    priority: 'high',
    state: 'upcoming',
  },
  {
    id: 't2',
    title: 'Client meeting',
    time: '02:00 PM',
    priority: 'medium',
    state: 'in_progress',
  },
  {
    id: 't3',
    title: 'Morning workout',
    time: '07:00 AM',
    priority: 'low',
    state: 'completed',
  },
  {
    id: 't4',
    title: 'Submit tax documents',
    time: 'Yesterday',
    priority: 'high',
    state: 'overdue',
  },
];

export const mockExpenses = [
  { id: 'e1', description: 'Tea', amount: 20, category: 'Food', date: 'Today' },
  { id: 'e2', description: 'Lunch', amount: 120, category: 'Food', date: 'Today' },
  { id: 'e3', description: 'Bus', amount: 40, category: 'Transport', date: 'Today' },
];

export const mockFocusSessions = {
  todayFocusTime: '1h 24m',
  sessionsCompleted: 3,
  upcomingSession: {
    title: 'Deep Work',
    time: '03:00 PM - 05:00 PM',
  },
};
