import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  return (
    <div className="flex flex-col min-h-screen-safe p-6 bg-background">
      <Link href="/login" className="mb-8 inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to login
      </Link>
      
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full gap-8 -mt-20">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Reset password</h1>
          <p className="text-muted-foreground">Enter your email address and we&apos;ll send you a link to reset your password.</p>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Email</label>
            <input type="email" placeholder="name@example.com" className="flex h-12 w-full rounded-xl border bg-transparent px-4 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
          </div>
          
          <Button className="w-full h-12 rounded-xl text-base mt-2">Send reset link</Button>
        </div>
      </div>
    </div>
  )
}
