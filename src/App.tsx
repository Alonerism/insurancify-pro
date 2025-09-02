import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import Policies from "./pages/Policies";
import CoverageMatrix from "./pages/CoverageMatrix";
import Renewals from "./pages/Renewals";
import Claims from "./pages/Claims";
import Contacts from "./pages/Contacts";
import Documents from "./pages/Documents";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="properties" element={<Properties />} />
            <Route path="policies" element={<Policies />} />
            <Route path="coverage-matrix" element={<CoverageMatrix />} />
            <Route path="renewals" element={<Renewals />} />
            <Route path="claims" element={<Claims />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="documents" element={<Documents />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
