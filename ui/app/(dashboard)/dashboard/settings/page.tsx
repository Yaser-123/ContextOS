"use client";

import { Topbar } from "@/components/Topbar";
import { motion } from "framer-motion";
import { Save, Key, Server, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { loadSettings, saveSettings, type Settings } from "@/lib/settings";
import { useToast } from "@/components/ui/use-toast";
import { refreshApiSettings } from '@/lib/api';

export default function SettingsPage() {
  const [togetherKey, setTogetherKey] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Load settings on mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        const settings = await loadSettings();
        setTogetherKey(settings.togetherApiKey || "");
        setGroqKey(settings.groqApiKey || "");
        setServerUrl(settings.serverUrl || "");
      } catch (error) {
        console.error("Failed to load settings:", error);
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, [toast]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveSettings({
        togetherApiKey: togetherKey,
        groqApiKey: groqKey,
        serverUrl: serverUrl,
      });
      
      // Clear cache so next API calls use new URL
      refreshApiSettings();
      
      toast({
        title: "Success",
        description: "Settings saved successfully! Reloading page...",
      });
      
      // Hard reload to clear all caches (including module/component caches)
      setTimeout(() => {
        window.location.href = window.location.href;
      }, 1000);
      
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
      setIsSaving(false);
    }
  };

  const handleBlur = async (field: keyof Settings, value: string) => {
    try {
      await saveSettings({ [field]: value });
      toast({
        title: "Saved",
        description: `${field} updated successfully`,
      });
    } catch (error) {
      console.error(`Failed to save ${field}:`, error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Topbar title="Settings" />
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-neon-blue" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Topbar title="Settings" />
      
      <div className="p-6 space-y-6 max-w-4xl animate-fade-in">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold gradient-text-blue">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure your API keys and backend server</p>
        </motion.div>

        {/* API Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-strong rounded-2xl p-6 space-y-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Key className="h-5 w-5 text-neon-blue" />
            <h2 className="text-xl font-semibold">API Configuration</h2>
          </div>

          {/* Together AI */}
          <div className="space-y-3">
            <Label htmlFor="together-key" className="text-sm font-medium">
              Together AI API Key
            </Label>
            <p className="text-xs text-muted-foreground">
              Primary LLM provider for context processing
            </p>
            <input
              id="together-key"
              type="password"
              placeholder="sk-..."
              value={togetherKey}
              onChange={(e) => setTogetherKey(e.target.value)}
              onBlur={() => handleBlur('togetherApiKey', togetherKey)}
              className="w-full px-4 py-3 glass rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-neon-blue/50 transition-all"
            />
          </div>

          <div className="h-px bg-white/10" />

          {/* Groq */}
          <div className="space-y-3">
            <Label htmlFor="groq-key" className="text-sm font-medium">
              Groq API Key
            </Label>
            <p className="text-xs text-muted-foreground">
              Fallback provider for high-speed inference
            </p>
            <input
              id="groq-key"
              type="password"
              placeholder="gsk_..."
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              onBlur={() => handleBlur('groqApiKey', groqKey)}
              className="w-full px-4 py-3 glass rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-neon-blue/50 transition-all"
            />
          </div>

          <div className="glass rounded-xl p-4">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Note:</strong> The system will automatically fall back to the alternate 
              provider if the primary provider fails or is unavailable.
            </p>
          </div>
        </motion.div>

        {/* Server Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-strong rounded-2xl p-6 space-y-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Server className="h-5 w-5 text-neon-purple" />
            <h2 className="text-xl font-semibold">Backend Server</h2>
          </div>

          <div className="space-y-3">
            <Label htmlFor="server-url" className="text-sm font-medium">
              Custom Server URL
            </Label>
            <p className="text-xs text-muted-foreground">
              Your personal backend server (leave empty for localhost:8000)
            </p>
            <input
              id="server-url"
              type="text"
              placeholder="https://myserver.com or http://localhost:8080"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              onBlur={() => handleBlur('serverUrl', serverUrl)}
              className="w-full px-4 py-3 glass rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/50 transition-all"
            />
          </div>

          <div className="glass rounded-xl p-4">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Self-hosting:</strong> Configure your own backend server URL for complete privacy. 
              All API calls will automatically route to this server instead of localhost.
            </p>
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-end gap-3"
        >
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="glass-strong text-white hover:bg-black"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save All Settings
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
