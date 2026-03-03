import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LeagueProvider } from "@/context/LeagueContext";
import Index from "./pages/Index";
import LeaguePage from "./pages/LeaguePage";
import RacePage from "./pages/RacePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LeagueProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/league/:leagueId" element={<LeaguePage />} />
            <Route path="/league/:leagueId/race/:raceId" element={<RacePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </LeagueProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
