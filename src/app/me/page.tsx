"use client";

import { mockUser } from "@/mocks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Bell, Palette, Lock, Download, LogOut, ChevronRight, Moon, Settings } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function MePage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  return (
    <div className="flex flex-col gap-6 p-6 pt-safe pb-24 min-h-screen-safe bg-secondary/30">
      <header className="flex items-center justify-between mt-4">
        <h1 className="text-3xl font-bold tracking-tight">Me</h1>
      </header>

      <div className="flex items-center gap-5 p-2">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-4 border-background shadow-sm">
          <span className="text-primary font-bold text-3xl">{mockUser.name[0]}</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold">{mockUser.name}</h2>
          <p className="text-sm text-muted-foreground font-medium flex items-center gap-1 mt-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <section>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Preferences</h3>
          <Card className="overflow-hidden border-0 shadow-sm">
            <CardContent className="p-0 divide-y">
              <SettingsRow icon={<Palette />} label="Appearance">
                {mounted && (
                  <button 
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full text-xs font-medium"
                  >
                    <Moon className="w-3.5 h-3.5" />
                    {theme === 'dark' ? 'Dark' : 'Light'}
                  </button>
                )}
              </SettingsRow>
              <SettingsRow icon={<Bell />} label="Notifications" />
              <SettingsRow icon={<Settings />} label="App Settings" />
            </CardContent>
          </Card>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Account</h3>
          <Card className="overflow-hidden border-0 shadow-sm">
            <CardContent className="p-0 divide-y">
              <SettingsRow icon={<User />} label="Profile details" />
              <SettingsRow icon={<Lock />} label="Privacy & Security" />
              <SettingsRow icon={<Download />} label="Export Data" />
            </CardContent>
          </Card>
        </section>
        
        <Button variant="destructive" className="w-full rounded-2xl h-14 text-base font-semibold shadow-sm">
          <LogOut className="w-5 h-5 mr-2" /> Log Out
        </Button>
      </div>
    </div>
  );
}

function SettingsRow({ icon, label, children }: { icon: React.ReactNode, label: string, children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors cursor-pointer">
      <div className="text-muted-foreground [&_svg]:w-5 [&_svg]:h-5">
        {icon}
      </div>
      <p className="flex-1 font-medium text-[15px]">{label}</p>
      {children ? children : <ChevronRight className="w-5 h-5 text-muted-foreground/50" />}
    </div>
  );
}
