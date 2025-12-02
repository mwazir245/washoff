import { useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Clock,
  DollarSign,
  TrendingUp,
  Settings,
  LogOut,
  ChevronRight,
  Check,
  X,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import logo from "@/assets/logo.png";

const mockOrders = [
  {
    id: "ORD001",
    customer: "Sarah M.",
    items: "3 kg wash, 5 items iron",
    total: 22.5,
    status: "pending",
    time: "10 min ago",
  },
  {
    id: "ORD002",
    customer: "John D.",
    items: "2 items dry clean",
    total: 16.0,
    status: "washing",
    time: "1 hour ago",
  },
  {
    id: "ORD003",
    customer: "Emily R.",
    items: "5 kg wash",
    total: 17.5,
    status: "ironing",
    time: "2 hours ago",
  },
  {
    id: "ORD004",
    customer: "Mike T.",
    items: "3 items dry clean",
    total: 24.0,
    status: "ready",
    time: "3 hours ago",
  },
];

const stats = [
  {
    label: "Today's Orders",
    value: "12",
    change: "+3",
    icon: Package,
    color: "bg-primary/10 text-primary",
  },
  {
    label: "In Progress",
    value: "5",
    change: "0",
    icon: Clock,
    color: "bg-warning/10 text-warning",
  },
  {
    label: "Today's Revenue",
    value: "$245",
    change: "+$45",
    icon: DollarSign,
    color: "bg-success/10 text-success",
  },
  {
    label: "This Week",
    value: "$1,240",
    change: "+12%",
    icon: TrendingUp,
    color: "bg-accent text-accent-foreground",
  },
];

const statusColors: Record<string, "default" | "warning" | "success" | "muted"> = {
  pending: "warning",
  washing: "default",
  ironing: "default",
  ready: "success",
  delivered: "muted",
};

const statusOptions = [
  "pending",
  "washing",
  "ironing",
  "drying",
  "ready",
  "out_for_delivery",
];

const ProviderDashboard = () => {
  const [orders, setOrders] = useState(mockOrders);

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    setOrders(
      orders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border hidden lg:flex flex-col">
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Wash Off" className="h-8 w-auto" />
            <span className="text-lg font-bold text-secondary">Wash Off</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Button variant="soft" className="w-full justify-start gap-3">
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3">
            <Package className="h-5 w-5" />
            Orders
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3">
            <Clock className="h-5 w-5" />
            History
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3">
            <DollarSign className="h-5 w-5" />
            Earnings
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3">
            <Settings className="h-5 w-5" />
            Settings
          </Button>
        </nav>

        <div className="p-4 border-t border-border">
          <Link to="/">
            <Button variant="ghost" className="w-full justify-start gap-3 text-destructive">
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
              <h1 className="text-xl font-semibold">Provider Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, Fresh & Clean Laundry
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="success">Open</Badge>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
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
                    <Badge variant="soft">{stat.change}</Badge>
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Button variant="ghost" size="sm" className="gap-2">
                View All <ChevronRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{order.customer}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.items}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {order.id} • {order.time}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-semibold">${order.total.toFixed(2)}</div>
                        <Select
                          value={order.status}
                          onValueChange={(value) =>
                            updateOrderStatus(order.id, value)
                          }
                        >
                          <SelectTrigger className="h-8 w-32 mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status.charAt(0).toUpperCase() +
                                  status.slice(1).replace("_", " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {order.status === "pending" && (
                        <div className="flex gap-2">
                          <Button size="icon" variant="outline" className="h-8 w-8">
                            <Check className="h-4 w-4 text-success" />
                          </Button>
                          <Button size="icon" variant="outline" className="h-8 w-8">
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ProviderDashboard;
