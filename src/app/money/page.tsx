import { mockExpenses } from "@/mocks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, IndianRupee, ArrowDownRight, TrendingUp } from "lucide-react";

export default function MoneyPage() {
  return (
    <div className="flex flex-col gap-6 p-6 pt-safe pb-24 min-h-screen-safe bg-background">
      <header className="flex items-center justify-between mt-4">
        <h1 className="text-3xl font-bold tracking-tight">Money</h1>
      </header>

      {/* Main Balance Card */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <TrendingUp className="w-32 h-32" />
        </div>
        <CardContent className="p-6 flex flex-col gap-6 relative z-10">
          <div className="space-y-1">
            <p className="text-slate-300 text-sm font-medium">Today&apos;s Spending</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl opacity-80">{mockExpenses.currency}</span>
              <span className="text-5xl font-bold tracking-tighter">{mockExpenses.todayTotal}</span>
            </div>
          </div>
          <div className="flex gap-4">
            <Button className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm">
              <Plus className="w-4 h-4 mr-2" /> Add Expense
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Entry Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <IndianRupee className="w-5 h-5 text-muted-foreground" />
        </div>
        <input 
          type="text" 
          placeholder="Quick add (e.g. 'Tea 20')" 
          className="w-full pl-11 pr-4 py-4 bg-secondary/50 border-0 rounded-2xl text-base focus:ring-2 focus:ring-primary focus:bg-background transition-all outline-none"
        />
        <div className="absolute inset-y-0 right-2 flex items-center">
          <Button size="icon" className="h-10 w-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <section className="space-y-4 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold tracking-tight">Recent Transactions</h3>
          <button className="text-sm text-primary font-medium">See all</button>
        </div>
        
        <div className="flex flex-col gap-3">
          {mockExpenses.recent.map(expense => (
            <div key={expense.id} className="flex items-center gap-4 p-4 rounded-2xl bg-card border shadow-sm">
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600">
                <ArrowDownRight className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold leading-none mb-1">{expense.title}</p>
                <p className="text-xs text-muted-foreground">{expense.category}</p>
              </div>
              <span className="font-bold text-lg">
                -{mockExpenses.currency}{expense.amount}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
