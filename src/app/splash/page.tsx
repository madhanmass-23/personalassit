export default function Splash() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen-safe bg-primary text-primary-foreground">
      <div className="w-24 h-24 bg-white/20 rounded-3xl backdrop-blur-xl flex items-center justify-center mb-6 shadow-2xl animate-pulse">
        <span className="text-4xl font-bold tracking-tighter">P</span>
      </div>
      <h1 className="text-2xl font-bold tracking-tight">Assistant</h1>
      <p className="text-primary-foreground/70 text-sm mt-2">Loading your day...</p>
    </div>
  )
}
