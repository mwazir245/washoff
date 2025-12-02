import { useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  Truck,
  Package,
  DollarSign,
  TrendingUp,
  Settings,
  LogOut,
  ChevronRight,
  Check,
  X,
  Eye,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import logo from "@/assets/logo.png";

const stats = [
  {
    label: "Total Users",
    value: "12,453",
    change: "+243",
    icon: Users,
    color: "bg-primary/10 text-primary",
  },
  {
    label: "Providers",
    value: "156",
    change: "+12",
    icon: Building2,
    color: "bg-success/10 text-success",
  },
  {
    label: "Drivers",
    value: "89",
    change: "+7",
    icon: Truck,
    color: "bg-warning/10 text-warning",
  },
  {
    label: "Total Orders",
    value: "45,231",
    change: "+1,234",
    icon: Package,
    color: "bg-accent text-accent-foreground",
  },
];

const pendingProviders = [
  {
    id: "1",
    name: "Clean Masters",
    location: "Downtown",
    date: "2 hours ago",
  },
  {
    id: "2",
    name: "Quick Wash Pro",
    location: "Uptown",
    date: "5 hours ago",
  },
  {
    id: "3",
    name: "Premium Care Laundry",
    location: "Midtown",
    date: "1 day ago",
  },
];

const recentOrders = [
  {
    id: "ORD12345",
    customer: "Sarah M.",
    provider: "Fresh & Clean",
    total: 22.5,
    status: "delivered",
  },
  {
    id: "ORD12346",
    customer: "John D.",
    provider: "Sparkle Wash",
    total: 45.0,
    status: "in_progress",
  },
  {
    id: "ORD12347",
    customer: "Emily R.",
    provider: "Premium Care",
    total: 18.0,
    status: "pending",
  },
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-secondary text-secondary-foreground hidden lg:flex flex-col">
        <div className="p-6 border-b border-secondary-foreground/10">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Wash Off" className="h-8 w-auto brightness-0 invert" />
            <span className="text-lg font-bold">Admin</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Button
            variant="ghost"
            className={`w-full justify-start gap-3 text-secondary-foreground/80 hover:text-secondary-foreground hover:bg-secondary-foreground/10 ${
              activeTab === "overview" ? "bg-secondary-foreground/10" : ""
            }`}
            onClick={() => setActiveTab("overview")}
          >
            <LayoutDashboard className="h-5 w-5" />
            Overview
          </Button>
          <Button
            variant="ghost"
            className={`w-full justify-start gap-3 text-secondary-foreground/80 hover:text-secondary-foreground hover:bg-secondary-foreground/10 ${
              activeTab === "users" ? "bg-secondary-foreground/10" : ""
            }`}
            onClick={() => setActiveTab("users")}
          >
            <Users className="h-5 w-5" />
            Customers
          </Button>
          <Button
            variant="ghost"
            className={`w-full justify-start gap-3 text-secondary-foreground/80 hover:text-secondary-foreground hover:bg-secondary-foreground/10 ${
              activeTab === "providers" ? "bg-secondary-foreground/10" : ""
            }`}
            onClick={() => setActiveTab("providers")}
          >
            <Building2 className="h-5 w-5" />
            Providers
          </Button>
          <Button
            variant="ghost"
            className={`w-full justify-start gap-3 text-secondary-foreground/80 hover:text-secondary-foreground hover:bg-secondary-foreground/10 ${
              activeTab === "drivers" ? "bg-secondary-foreground/10" : ""
            }`}
            onClick={() => setActiveTab("drivers")}
          >
            <Truck className="h-5 w-5" />
            Drivers
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-secondary-foreground/80 hover:text-secondary-foreground hover:bg-secondary-foreground/10"
          >
            <Package className="h-5 w-5" />
            Orders
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-secondary-foreground/80 hover:text-secondary-foreground hover:bg-secondary-foreground/10"
          >
            <DollarSign className="h-5 w-5" />
            Payments
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-secondary-foreground/80 hover:text-secondary-foreground hover:bg-secondary-foreground/10"
          >
            <TrendingUp className="h-5 w-5" />
            Reports
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-secondary-foreground/80 hover:text-secondary-foreground hover:bg-secondary-foreground/10"
          >
            <Settings className="h-5 w-5" />
            Settings
          </Button>
        </nav>

        <div className="p-4 border-t border-secondary-foreground/10">
          <Link to="/">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64">
        {/* Header */}
        <header className="bg-card border-b border-border sticky top-0 z-40">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, Administrator
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-10" />
              </div>
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold">
                A
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Stats */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${stat.color}`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <Badge variant="success">{stat.change}</Badge>
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Pending Approvals */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Pending Provider Approvals</CardTitle>
                <Badge variant="warning">{pendingProviders.length}</Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingProviders.map((provider) => (
                    <div
                      key={provider.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{provider.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {provider.location} • {provider.date}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="icon" variant="outline" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="outline" className="h-8 w-8">
                          <Check className="h-4 w-4 text-success" />
                        </Button>
                        <Button size="icon" variant="outline" className="h-8 w-8">
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Orders</CardTitle>
                <Button variant="ghost" size="sm" className="gap-2">
                  View All <ChevronRight className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                    >
                      <div>
                        <div className="font-medium">{order.id}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.customer} → {order.provider}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold">${order.total.toFixed(2)}</span>
                        <Badge
                          variant={
                            order.status === "delivered"
                              ? "success"
                              : order.status === "in_progress"
                              ? "default"
                              : "warning"
                          }
                        >
                          {order.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart Placeholder */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted/50 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Revenue chart placeholder</p>
                  <p className="text-sm text-muted-foreground">
                    Connect to backend for real data
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
