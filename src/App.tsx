

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import StartupsList from "./pages/StartupsList";
import CreateStartup from "./pages/CreateStartup";
import StartupDetail from "./pages/StartupDetail";
import EditStartup from "./pages/EditStartup";
import Status from "./pages/Status";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  console.log('App component rendering...');
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/:id"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/edit"
                element={
                  <ProtectedRoute>
                    <EditProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/startups"
                element={
                  <ProtectedRoute>
                    <StartupsList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/startups/create"
                element={
                  <ProtectedRoute>
                    <CreateStartup />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/startups/:id"
                element={
                  <ProtectedRoute>
                    <StartupDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/startups/:id/edit"
                element={
                  <ProtectedRoute>
                    <EditStartup />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/status"
                element={
                  <ProtectedRoute>
                    <Status />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
