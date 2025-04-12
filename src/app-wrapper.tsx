
'use client';

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import React from "react";
import { I18nProvider } from "./components/providers/I18nProvider";

// Create query client outside of the component to avoid recreation on each render
const queryClient = new QueryClient();

export default function AppWrapper({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  // Make sure the app renders properly even if the tooltip provider has issues
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <TooltipProvider delayDuration={0}>
            <Toaster />
            <Sonner />
            {children}
          </TooltipProvider>
        </I18nProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
}
