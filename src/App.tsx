import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LeagueProvider } from "@/context/LeagueContext";
import { AuthProvider } from "@/context/AuthContext";
import { RaceProvider } from "@/context/RaceContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import LeaguePage from "./pages/LeaguePage";
import RacePage from "./pages/RacePage";
import NotFound from "./pages/NotFound";
import AdminPanel from "./components/AdminPanel";
import AdminClaimsManager from "./components/AdminClaimsManager";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <RaceProvider>
          <LeagueProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <Routes>
              {/* Login serves as the base page. Redirects to /home internally if logged in */}
              <Route path="/" element={<Login />} />
              <Route path="/home" element={<Index />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/admin/claims/:raceId" element={<AdminClaimsManager />} />
              {/* Legacy paths support */}
              <Route path="/league/:leagueId" element={<LeaguePage />} />
              <Route path="/league/:leagueId/race/:raceId" element={<RacePage />} />
              <Route path="/race/:raceId" element={<RacePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </LeagueProvider>
        </RaceProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
