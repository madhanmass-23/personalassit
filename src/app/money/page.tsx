"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, IndianRupee, ArrowDownRight, ArrowUpRight, TrendingUp } from "lucide-react";
import { expenseService } from "@/services/api/expense";
import { incomeService } from "@/services/api/income";
import { reportService } from "@/services/api/reports";

export default function MoneyPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [report, setReport] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  
  const [quickEntry, setQuickEntry] = useState("");
  const [entryMode, setEntryMode] = useState<"expense" | "income">("expense");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reportData, expensesData, incomeData] = await Promise.all([
        reportService.getToday(),
        expenseService.getAll(),
        incomeService.getAll()
      ]);
      
      setReport(reportData);
      
      // Combine and sort recent transactions
      const exp = Array.isArray(expensesData) ? expensesData.map(e => ({ ...e, type: 'expense', date: e.expense_date })) : [];
      const inc = Array.isArray(incomeData) ? incomeData.map(i => ({ ...i, type: 'income', date: i.income_date, description: i.source })) : [];
      
      const all = [...exp, ...inc].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      setTransactions(all);
    } catch (err: any) {
      setError(err.message || "Failed to load financial data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleQuickAdd = async () => {
    if (!quickEntry.trim()) return;
    
    // Basic parser for "Tea 20"
    const parts = quickEntry.trim().split(' ');
    const amountStr = parts.pop() || '';
    let amount = parseFloat(amountStr);
    
    let description = parts.join(' ');
    
    // If reverse like "20 Tea"
    if (isNaN(amount) && !isNaN(parseFloat(parts[0]))) {
      amount = parseFloat(parts[0]);
      description = [amountStr, ...parts.slice(1)].join(' ');
    }
    
    if (isNaN(amount) || amount <= 0) {
      alert("Could not parse amount. Try format 'Item 100'");
      return;
    }
    
    if (!description) {
      description = "Misc";
    }

    const today = new Date().toISOString().slice(0, 19).replace('T', ' ');

    try {
      if (entryMode === "expense") {
        await expenseService.create({
          amount,
          description,
          expense_date: today
        });
      } else {
        await incomeService.create({
          amount,
          source: description,
          income_date: today
        });
      }
      setQuickEntry("");
      fetchData(); // Refresh data
    } catch (err: any) {
      alert(err.message || "Failed to add entry");
    }
  };

  if (loading && !report) {
    return <div className="flex justify-center items-center py-20">Loading...</div>;
  }
  
  if (error && !report) {
    return (
      <div className="flex flex-col justify-center items-center py-10 text-red-500">
        <p>{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const earned = report?.income || 0;
  const spent = report?.expense || 0;
  const kept = report?.kept || (earned - spent);

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
          
          <div className="grid grid-cols-2 gap-4 border-b border-white/10 pb-4">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Earned Today</p>
              <p className="text-2xl font-bold text-green-400">₹{earned}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Spent Today</p>
              <p className="text-2xl font-bold text-red-400">₹{spent}</p>
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-slate-300 text-sm font-medium uppercase tracking-wider">Kept</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tighter">₹{kept}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <Button 
              onClick={() => setEntryMode('expense')}
              className={`flex-1 ${entryMode === 'expense' ? 'bg-white text-black hover:bg-gray-200' : 'bg-white/20 hover:bg-white/30 text-white'} border-0 backdrop-blur-sm transition-colors`}
            >
              - Expense
            </Button>
            <Button 
              onClick={() => setEntryMode('income')}
              className={`flex-1 ${entryMode === 'income' ? 'bg-white text-black hover:bg-gray-200' : 'bg-white/20 hover:bg-white/30 text-white'} border-0 backdrop-blur-sm transition-colors`}
            >
              + Income
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Entry Input */}
      <div className="relative flex flex-col gap-2">
        <p className="text-sm font-medium ml-1">
          Quick add {entryMode} (e.g. {entryMode === 'expense' ? "'Tea 20'" : "'Salary 5000'"})
        </p>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <IndianRupee className="w-5 h-5 text-muted-foreground" />
          </div>
          <input 
            type="text" 
            value={quickEntry}
            onChange={(e) => setQuickEntry(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
            placeholder={entryMode === 'expense' ? "Tea 20" : "Salary 5000"} 
            className="w-full pl-11 pr-14 py-4 bg-secondary/50 border-0 rounded-2xl text-base focus:ring-2 focus:ring-primary focus:bg-background transition-all outline-none"
          />
          <div className="absolute inset-y-0 right-2 flex items-center">
            <Button onClick={handleQuickAdd} size="icon" className={`h-10 w-10 rounded-xl ${entryMode === 'expense' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}>
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <section className="space-y-4 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold tracking-tight">Recent Transactions</h3>
        </div>
        
        {transactions.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            No transactions found.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {transactions.slice(0, 10).map(t => (
              <div key={`${t.type}-${t.id}`} className="flex items-center gap-4 p-4 rounded-2xl bg-card border shadow-sm">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${t.type === 'expense' ? 'bg-red-500/10 text-red-600' : 'bg-green-500/10 text-green-600'}`}>
                  {t.type === 'expense' ? <ArrowDownRight className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-semibold leading-none mb-1 truncate">{t.description}</p>
                  <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString()}</p>
                </div>
                <span className={`font-bold text-lg ${t.type === 'expense' ? '' : 'text-green-600'}`}>
                  {t.type === 'expense' ? '-' : '+'}₹{t.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
