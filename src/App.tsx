import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Laundries from "./pages/Laundries";
import LaundryProfile from "./pages/LaundryProfile";
import Order from "./pages/Order";
import OrderTracking from "./pages/OrderTracking";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import Rating from "./pages/Rating";
import HowItWorks from "./pages/HowItWorks";
import Donation from "./pages/Donation";
import Auth from "./pages/Auth";
import ProviderRegister from "./pages/provider/ProviderRegister";
import ProviderDashboard from "./pages/provider/ProviderDashboard";
import DeliveryRegister from "./pages/delivery/DeliveryRegister";
import DeliveryDashboard from "./pages/delivery/DeliveryDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Customer Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/laundries" element={<Laundries />} />
              <Route path="/laundry/:id" element={<LaundryProfile />} />
              <Route path="/order/:id" element={<Order />} />
              <Route path="/tracking/:orderId" element={<OrderTracking />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/rating/:orderId" element={<Rating />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/donation" element={<Donation />} />
              <Route path="/auth" element={<Auth />} />
              
              {/* Provider Routes */}
              <Route path="/provider/register" element={<ProviderRegister />} />
              <Route path="/provider/dashboard" element={<ProviderDashboard />} />
              
              {/* Delivery Routes */}
              <Route path="/delivery/register" element={<DeliveryRegister />} />
              <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminDashboard />} />
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
