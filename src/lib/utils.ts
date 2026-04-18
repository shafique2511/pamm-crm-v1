import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export let GLOBAL_CURRENCY = 'USD';

export function setGlobalCurrency(c: string) {
  GLOBAL_CURRENCY = c;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency?: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || GLOBAL_CURRENCY,
  }).format(value);
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function evaluatePasswordStrength(password: string): { score: number, label: string, color: string } {
  let score = 0;
  if (!password) return { score: 0, label: 'None', color: 'bg-slate-200' };
  
  if (password.length > 8) score += 1;
  if (password.length > 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score < 2) return { score: 1, label: 'Weak', color: 'bg-red-500' };
  if (score < 4) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
  if (score < 5) return { score: 3, label: 'Good', color: 'bg-blue-500' };
  return { score: 4, label: 'Strong', color: 'bg-green-500' };
}
