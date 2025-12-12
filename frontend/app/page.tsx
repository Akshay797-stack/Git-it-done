"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { RepoSelector } from "@/components/repo-selector";
import { IssueList } from "@/components/issue-list";
import { LiveLogs } from "@/components/live-logs";
import { Github, LogOut, Sparkles, Zap, Code, GitBranch } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const [selectedRepo, setSelectedRepo] = useState<any>(null);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isFixing, setIsFixing] = useState(false);

  const startFix = async () => {
    if (!selectedIssue || !selectedRepo) return;

    setIsFixing(true);
    try {
      const res = await fetch('/api/kestra-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueUrl: selectedIssue.html_url,
          repoUrl: selectedRepo.html_url,
          githubToken: (session as any)?.accessToken || ''
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Request failed with status ${res.status}`);
      }

      const data = await res.json();
      setJobId(data.jobId);
    } catch (e: any) {
      console.error(e);
      alert("Failed to start autofix: " + e.message);
    } finally {
      setIsFixing(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
          <div className="text-center mb-12 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Issue Resolution
            </div>

            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent animate-gradient">
              AutoFix AI
            </h1>

            <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto">
              Automatically fix GitHub issues with AI-powered code generation
            </p>

            <div className="flex flex-wrap justify-center gap-8 mt-12 text-gray-500">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span>Instant Fixes</span>
              </div>
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-green-500" />
                <span>Smart AI</span>
              </div>
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-blue-500" />
                <span>Auto PR</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => signIn("github")}
            className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold text-white shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl opacity-0 group-hover:opacity-100 blur transition-opacity"></div>
            <div className="relative flex items-center gap-3">
              <Github className="w-6 h-6" />
              <span className="text-lg">Sign in with GitHub</span>
            </div>
          </button>

          <p className="mt-8 text-sm text-gray-500">
            Powered by AI & Kestra
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                AutoFix AI
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700">
                <img
                  src={(session.user as any)?.image}
                  alt="avatar"
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm text-gray-300">{(session.user as any)?.name}</span>
              </div>
              <button
                onClick={() => signOut()}
                className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {!jobId ? (
          <div className="space-y-8">
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${selectedRepo ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-blue-500/20 border-blue-500/50 text-blue-400'} border`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${selectedRepo ? 'bg-green-500' : 'bg-blue-500'}`}>
                  1
                </div>
                <span className="text-sm font-medium">Select Repository</span>
              </div>
              <div className="w-12 h-0.5 bg-gray-700"></div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${selectedIssue ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-gray-800 border-gray-700 text-gray-500'} border`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${selectedIssue ? 'bg-green-500' : 'bg-gray-700'}`}>
                  2
                </div>
                <span className="text-sm font-medium">Choose Issue</span>
              </div>
              <div className="w-12 h-0.5 bg-gray-700"></div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800 border border-gray-700 text-gray-500">
                <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <span className="text-sm font-medium">Fix Issue</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Repository Selection */}
              <div className="space-y-4">
                <RepoSelector
                  onSelect={setSelectedRepo}
                  selectedRepo={selectedRepo}
                />
                {selectedRepo && (
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                    ✓ Selected: <strong>{selectedRepo.full_name}</strong>
                  </div>
                )}
              </div>

              {/* Issue Selection */}
              <div className="space-y-4">
                {selectedRepo ? (
                  <>
                    <IssueList
                      repo={selectedRepo}
                      onSelect={setSelectedIssue}
                      selectedIssue={selectedIssue}
                    />
                    {selectedIssue && (
                      <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                        ✓ Selected: <strong>#{selectedIssue.number} - {selectedIssue.title}</strong>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-[400px] flex items-center justify-center bg-gray-900 border border-gray-800 rounded-xl">
                    <p className="text-gray-500">Select a repository first</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Button */}
            {selectedIssue && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={startFix}
                  disabled={isFixing}
                  className="group relative px-12 py-5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-white shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl opacity-0 group-hover:opacity-100 blur transition-opacity"></div>
                  <div className="relative flex items-center gap-3">
                    {isFixing ? (
                      <>
                        <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-lg">Starting AI Fix...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-6 h-6" />
                        <span className="text-lg">Auto-Fix Issue with AI</span>
                      </>
                    )}
                  </div>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Execution Header */}
            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">AI is fixing your issue...</h2>
                  <p className="text-gray-400">
                    Repository: <span className="text-blue-400 font-mono">{selectedRepo?.full_name}</span> •
                    Issue: <span className="text-purple-400">#{selectedIssue?.number}</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setJobId(null);
                    setSelectedIssue(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 transition-all"
                >
                  Start New Fix
                </button>
              </div>
            </div>

            {/* Live Logs */}
            <LiveLogs
              jobId={jobId}
              onBack={() => {
                setJobId(null);
                setSelectedIssue(null);
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
}
