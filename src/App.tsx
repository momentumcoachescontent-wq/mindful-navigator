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
import Shop from "./pages/Shop";
import DataManagement from "./pages/DataManagement";
import MyOrders from "./pages/MyOrders";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";


import AdminUsers from "./pages/AdminUsers";
import AdminProducts from "./pages/AdminProducts";
import AdminAudio from "./pages/AdminAudio";
import Library from "./pages/Library";
import NotFound from "./pages/NotFound";
import { AudioProvider } from "@/contexts/AudioContext";
import { AudioPlayer } from "@/components/audio/AudioPlayer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>

          <AuthProvider>
            <AudioProvider>
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
                <Route path="/library" element={<Library />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/premium" element={<Premium />} />
                <Route path="/orders" element={<MyOrders />} />
                <Route path="/data" element={<DataManagement />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/settings/notifications" element={<Settings />} />
                <Route path="/settings/privacy" element={<Settings />} />
                <Route path="/settings/contacts" element={<Settings />} />
                <Route path="/settings/appearance" element={<Settings />} />
                <Route path="/settings/profile" element={<Settings />} />

                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/audio" element={<AdminAudio />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <AudioPlayer />
            </AudioProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
