import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Navigation,
  Package,
  Clock,
  DollarSign,
  MapPin,
  Phone,
  Check,
  ChevronRight,
  User,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import logo from "@/assets/logo.png";

const mockTasks = [
  {
    id: "TASK001",
    type: "pickup",
    customer: "Sarah M.",
    address: "123 Main Street, Apt 4B",
    laundry: "Fresh & Clean Laundry",
    time: "11:00 AM - 1:00 PM",
    status: "in_progress",
    earnings: 5.0,
  },
  {
    id: "TASK002",
    type: "delivery",
    customer: "John D.",
    address: "456 Oak Avenue, Suite 12",
    laundry: "Fresh & Clean Laundry",
    time: "2:00 PM - 4:00 PM",
    status: "pending",
    earnings: 5.0,
  },
  {
    id: "TASK003",
    type: "pickup",
    customer: "Emily R.",
    address: "789 Pine Road",
    laundry: "Sparkle Wash",
    time: "4:00 PM - 6:00 PM",
    status: "pending",
    earnings: 6.0,
  },
];

const DeliveryDashboard = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [tasks, setTasks] = useState(mockTasks);

  const completeTask = (taskId: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, status: "completed" } : task
      )
    );
  };

  const pendingTasks = tasks.filter((t) => t.status !== "completed");
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const totalEarnings = completedTasks.reduce((sum, t) => sum + t.earnings, 0);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Wash Off" className="h-8 w-auto" />
              <span className="text-lg font-bold text-secondary">Delivery</span>
            </Link>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {isOnline ? "Online" : "Offline"}
                </span>
                <Switch checked={isOnline} onCheckedChange={setIsOnline} />
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Status Banner */}
        <Card
          className={`mb-6 ${
            isOnline
              ? "bg-success/10 border-success/30"
              : "bg-muted border-muted-foreground/30"
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`h-3 w-3 rounded-full ${
                  isOnline ? "bg-success animate-pulse" : "bg-muted-foreground"
                }`}
              />
              <span className="font-medium">
                {isOnline
                  ? "You're online and receiving tasks"
                  : "You're offline"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Package className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{pendingTasks.length}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Check className="h-6 w-6 text-success mx-auto mb-2" />
              <div className="text-2xl font-bold">{completedTasks.length}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-6 w-6 text-warning mx-auto mb-2" />
              <div className="text-2xl font-bold">${totalEarnings}</div>
              <div className="text-xs text-muted-foreground">Earned</div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Active Tasks</span>
              <Badge>{pendingTasks.length} remaining</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingTasks.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No active tasks</p>
              </div>
            ) : (
              pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 bg-muted/50 rounded-xl space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={task.type === "pickup" ? "default" : "success"}
                    >
                      {task.type === "pickup" ? "📥 Pickup" : "📤 Delivery"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      ${task.earnings.toFixed(2)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{task.customer}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{task.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{task.time}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-2">
                      <Navigation className="h-4 w-4" />
                      Navigate
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-2">
                      <Phone className="h-4 w-4" />
                      Call
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => completeTask(task.id)}
                    >
                      <Check className="h-4 w-4" />
                      Done
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Completed Today</span>
                <Button variant="ghost" size="sm" className="gap-2">
                  View All <ChevronRight className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                        <Check className="h-4 w-4 text-success" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{task.customer}</p>
                        <p className="text-xs text-muted-foreground">
                          {task.type === "pickup" ? "Pickup" : "Delivery"}
                        </p>
                      </div>
                    </div>
                    <span className="font-medium text-success">
                      +${task.earnings.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border">
        <div className="flex items-center justify-around py-3">
          <Button variant="ghost" className="flex-col gap-1 h-auto py-2">
            <Package className="h-5 w-5" />
            <span className="text-xs">Tasks</span>
          </Button>
          <Button variant="ghost" className="flex-col gap-1 h-auto py-2">
            <Clock className="h-5 w-5" />
            <span className="text-xs">History</span>
          </Button>
          <Button variant="ghost" className="flex-col gap-1 h-auto py-2">
            <DollarSign className="h-5 w-5" />
            <span className="text-xs">Earnings</span>
          </Button>
          <Link to="/">
            <Button variant="ghost" className="flex-col gap-1 h-auto py-2">
              <LogOut className="h-5 w-5" />
              <span className="text-xs">Logout</span>
            </Button>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default DeliveryDashboard;
