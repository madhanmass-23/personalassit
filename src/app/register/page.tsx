import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Register() {
  return (
    <div className="flex flex-col min-h-screen-safe p-6 bg-background">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full gap-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
          <p className="text-muted-foreground">Start managing your personal productivity.</p>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Name</label>
            <input type="text" placeholder="Alex" className="flex h-12 w-full rounded-xl border bg-transparent px-4 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Email</label>
            <input type="email" placeholder="name@example.com" className="flex h-12 w-full rounded-xl border bg-transparent px-4 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Password</label>
            <input type="password" placeholder="••••••••" className="flex h-12 w-full rounded-xl border bg-transparent px-4 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
          </div>
          
          <Button className="w-full h-12 rounded-xl text-base mt-2">Sign Up</Button>
        </div>
        
        <p className="text-center text-sm text-muted-foreground">
          Already have an account? <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
