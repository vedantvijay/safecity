import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import Login from "./pages/Login";
import Community from "./pages/Community";
import MapPage from "./pages/MapPage";
import Heatmap from "./pages/Heatmap";
import NotFound from "./pages/NotFound";
import APITest from "./components/APITest";
import ChatbotTest from "./components/ChatbotTest";
import LocationTest from "./components/LocationTest";
import BackendTest from "./components/BackendTest";
import SimpleTest from "./components/SimpleTest";
import CSVTest from "./components/CSVTest";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Navigation />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/community" element={<Community />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/heatmap" element={<Heatmap />} />
            <Route path="/api-test" element={<APITest />} />
            <Route path="/chatbot-test" element={<ChatbotTest />} />
            <Route path="/location-test" element={<LocationTest />} />
            <Route path="/backend-test" element={<BackendTest />} />
            <Route path="/simple-test" element={<SimpleTest />} />
            <Route path="/csv-test" element={<CSVTest />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
