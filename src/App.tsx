// src/App.tsx
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./components/Login";
import { ThemeProvider } from "./components/theme-provider";

const queryClient = new QueryClient();

const App = () => {
  const [token, setToken] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);

  // Check if user is already authenticated on component mount
  useEffect(() => {
    const savedToken = localStorage.getItem("utmValidationToken");
    const savedAccountId = localStorage.getItem("utmValidationAccountId");

    if (savedToken && savedAccountId) {
      setToken(savedToken);
      setAccountId(savedAccountId);
    }
  }, []);

  // Function to handle login
  const handleLogin = (newToken: string, newAccountId: string) => {
    setToken(newToken);
    setAccountId(newAccountId);
  };

  // Function to handle logout
  const handleLogout = () => {
    localStorage.removeItem("utmValidationToken");
    localStorage.removeItem("utmValidationAccountId");
    setToken(null);
    setAccountId(null);
  };
  return (
    <ThemeProvider defaultTheme="dark" storageKey="theme-utm-validation">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {!token ? (
              <Login onLogin={handleLogin} />
          ) : (
              <BrowserRouter>
                <Routes>
                  <Route
                      path="/"
                      element={
                        <Index
                            onLogout={handleLogout}
                            token={token}
                            accountId={accountId || ""}
                        />
                      }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
          )}
        </TooltipProvider>
      </QueryClientProvider>
      </ThemeProvider>
  );
};

export default App;