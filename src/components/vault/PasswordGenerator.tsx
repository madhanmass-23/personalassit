"use client";

import { useState } from "react";
import { generateSecurePassword, evaluatePasswordStrength } from "@/lib/crypto/vault";
import { Button } from "@/components/ui/button";
import { RefreshCw, Check, ShieldCheck, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordGeneratorProps {
  onSelectPassword: (password: string) => void;
  onClose?: () => void;
}

export function PasswordGenerator({ onSelectPassword, onClose }: PasswordGeneratorProps) {
  const [length, setLength] = useState(18);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState(() =>
    generateSecurePassword({ length: 18, uppercase: true, lowercase: true, numbers: true, symbols: true })
  );
  const [copied, setCopied] = useState(false);

  const handleGenerateWithParams = (
    newLength = length,
    newUpper = uppercase,
    newLower = lowercase,
    newNum = numbers,
    newSym = symbols
  ) => {
    const pwd = generateSecurePassword({
      length: newLength,
      uppercase: newUpper,
      lowercase: newLower,
      numbers: newNum,
      symbols: newSym,
    });
    setGeneratedPassword(pwd);
  };

  const handleGenerate = () => {
    handleGenerateWithParams(length, uppercase, lowercase, numbers, symbols);
  };

  const strength = evaluatePasswordStrength(generatedPassword);

  const handleCopy = async () => {
    if (!generatedPassword) return;
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback
    }
  };

  const handleApply = () => {
    if (generatedPassword) {
      onSelectPassword(generatedPassword);
      if (onClose) onClose();
    }
  };

  return (
    <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 dark:bg-primary/10 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Secure Password Generator</span>
        </div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          CSPRNG
        </span>
      </div>

      {/* Generated Password Box */}
      <div className="flex items-center gap-2 p-3 rounded-xl border border-input bg-card/80 font-mono text-sm break-all select-all">
        <span className="flex-1 text-foreground font-medium tracking-wide">
          {generatedPassword}
        </span>
        <button
          type="button"
          onClick={handleGenerate}
          aria-label="Generate new password"
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy generated password"
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {/* Strength indicator */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Strength: <strong className="text-foreground">{strength.label}</strong></span>
          <span>{length} characters</span>
        </div>
        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden flex gap-0.5">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              strength.score <= 1 && "w-1/4 bg-destructive",
              strength.score === 2 && "w-2/4 bg-amber-500",
              strength.score === 3 && "w-3/4 bg-blue-500",
              strength.score >= 4 && "w-full bg-emerald-500"
            )}
          />
        </div>
      </div>

      {/* Length Slider */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-medium text-foreground">
          <span>Password Length</span>
          <span className="font-mono text-primary font-bold">{length}</span>
        </div>
        <input
          type="range"
          min="12"
          max="64"
          value={length}
          onChange={(e) => {
            const next = parseInt(e.target.value, 10);
            setLength(next);
            handleGenerateWithParams(next, uppercase, lowercase, numbers, symbols);
          }}
          className="w-full accent-primary h-2 bg-secondary rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
          <span>12</span>
          <span>24</span>
          <span>36</span>
          <span>48</span>
          <span>64</span>
        </div>
      </div>

      {/* Options Checkboxes */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <label className="flex items-center gap-2 select-none cursor-pointer">
          <input
            type="checkbox"
            checked={uppercase}
            onChange={(e) => {
              const next = e.target.checked;
              setUppercase(next);
              handleGenerateWithParams(length, next, lowercase, numbers, symbols);
            }}
            className="rounded border-input text-primary focus:ring-primary h-4 w-4"
          />
          <span className="text-foreground font-medium">Uppercase (A-Z)</span>
        </label>
        <label className="flex items-center gap-2 select-none cursor-pointer">
          <input
            type="checkbox"
            checked={lowercase}
            onChange={(e) => {
              const next = e.target.checked;
              setLowercase(next);
              handleGenerateWithParams(length, uppercase, next, numbers, symbols);
            }}
            className="rounded border-input text-primary focus:ring-primary h-4 w-4"
          />
          <span className="text-foreground font-medium">Lowercase (a-z)</span>
        </label>
        <label className="flex items-center gap-2 select-none cursor-pointer">
          <input
            type="checkbox"
            checked={numbers}
            onChange={(e) => {
              const next = e.target.checked;
              setNumbers(next);
              handleGenerateWithParams(length, uppercase, lowercase, next, symbols);
            }}
            className="rounded border-input text-primary focus:ring-primary h-4 w-4"
          />
          <span className="text-foreground font-medium">Numbers (0-9)</span>
        </label>
        <label className="flex items-center gap-2 select-none cursor-pointer">
          <input
            type="checkbox"
            checked={symbols}
            onChange={(e) => {
              const next = e.target.checked;
              setSymbols(next);
              handleGenerateWithParams(length, uppercase, lowercase, numbers, next);
            }}
            className="rounded border-input text-primary focus:ring-primary h-4 w-4"
          />
          <span className="text-foreground font-medium">Symbols (!@#$)</span>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        <Button
          type="button"
          onClick={handleApply}
          className="flex-1 rounded-xl h-10 bg-primary text-primary-foreground font-semibold text-xs min-h-[40px]"
        >
          Use This Password
        </Button>
        {onClose && (
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl h-10 text-xs min-h-[40px]"
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
