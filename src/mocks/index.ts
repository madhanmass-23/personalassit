export const mockUser = {
  name: "Alex",
  greeting: "Good morning",
};

export const mockTasks = [
  { id: "1", title: "Review product design", time: "10:00 AM", priority: "high", completed: false },
  { id: "2", title: "Weekly sync with team", time: "2:00 PM", priority: "medium", completed: false },
  { id: "3", title: "Buy groceries", time: "6:00 PM", priority: "low", completed: false },
  { id: "4", title: "Morning workout", time: "7:00 AM", priority: "high", completed: true },
];

export const mockExpenses = {
  todayTotal: 250,
  currency: "₹",
  recent: [
    { id: "1", title: "Tea", amount: 20, category: "Food" },
    { id: "2", title: "Lunch", amount: 150, category: "Food" },
    { id: "3", title: "Bus", amount: 80, category: "Transport" },
  ],
};

export const mockFocus = {
  todayTotal: "2h 15m",
  sessions: 3,
  upcoming: {
    title: "Deep Work: Coding",
    time: "3:00 PM",
    duration: "90m",
  },
};
