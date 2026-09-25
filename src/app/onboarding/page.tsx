import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function Onboarding() {
  return (
    <div className="flex flex-col min-h-screen-safe p-6 bg-background">
      <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full gap-10">
        
        <div className="w-32 h-32 bg-primary/10 rounded-[2rem] flex items-center justify-center">
          <CheckCircle2 className="w-16 h-16 text-primary" />
        </div>
        
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold tracking-tighter leading-tight">Your life, organized.</h1>
          <p className="text-muted-foreground text-lg px-4">
            Tasks, finances, and focus all in one premium space.
          </p>
        </div>
        
      </div>
      
      <div className="space-y-4 pb-8 max-w-sm mx-auto w-full">
        <Button asChild className="w-full h-14 rounded-2xl text-lg font-semibold shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground group">
          <Link href="/register">
            Get Started <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
        <p className="text-center text-sm font-medium">
          <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
            I already have an account
          </Link>
        </p>
      </div>
    </div>
  )
}
