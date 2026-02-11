import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Scanner from "./pages/Scanner";
import Tools from "./pages/Tools";
import ToolDetail from "./pages/ToolDetail";
import Journal from "./pages/Journal";
import JournalEntry from "./pages/JournalEntry";
import Community from "./pages/Community";
import Profile from "./pages/Profile";
import Meditations from "./pages/Meditations";
import Onboarding from "./pages/Onboarding";
import Premium from "./pages/Premium";
import DataManagement from "./pages/DataManagement";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/scanner" element={<Scanner />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/tools/:id" element={<ToolDetail />} />
              <Route path="/journal" element={<Journal />} />
              <Route path="/journal/new" element={<JournalEntry />} />
              <Route path="/journal/:id" element={<JournalEntry />} />
              <Route path="/community" element={<Community />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/meditations" element={<Meditations />} />
              <Route path="/premium" element={<Premium />} />
              <Route path="/data" element={<DataManagement />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/notifications" element={<Settings />} />
              <Route path="/settings/privacy" element={<Settings />} />
              <Route path="/settings/contacts" element={<Settings />} />
              <Route path="/settings/appearance" element={<Settings />} />
              <Route path="/settings/profile" element={<Settings />} />
              <Route path="/admin" element={<AdminDashboard />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
