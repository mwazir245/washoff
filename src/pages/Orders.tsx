import { Link } from "react-router-dom";
import { Package, Clock, Check, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/layout/Layout";

const mockOrders = [
  {
    id: "ORD123",
    laundry: "Fresh & Clean Laundry",
    image: "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=100&h=100&fit=crop",
    items: "3 kg wash, 5 items iron",
    total: 22.5,
    status: "in_progress",
    statusLabel: "In Washing",
    date: "Today",
  },
  {
    id: "ORD122",
    laundry: "Sparkle Wash",
    image: "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=100&h=100&fit=crop",
    items: "2 items dry clean",
    total: 16.0,
    status: "out_for_delivery",
    statusLabel: "Out for Delivery",
    date: "Today",
  },
  {
    id: "ORD121",
    laundry: "Premium Garment Care",
    image: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=100&h=100&fit=crop",
    items: "5 kg wash",
    total: 17.5,
    status: "delivered",
    statusLabel: "Delivered",
    date: "Yesterday",
  },
  {
    id: "ORD120",
    laundry: "Fresh & Clean Laundry",
    image: "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=100&h=100&fit=crop",
    items: "4 items iron, 2 dry clean",
    total: 28.0,
    status: "delivered",
    statusLabel: "Delivered",
    date: "2 days ago",
  },
];

const statusColors: Record<string, "default" | "warning" | "success" | "muted"> = {
  pending: "warning",
  in_progress: "default",
  out_for_delivery: "default",
  delivered: "success",
  cancelled: "muted",
};

const Orders = () => {
  const activeOrders = mockOrders.filter((o) => o.status !== "delivered");
  const completedOrders = mockOrders.filter((o) => o.status === "delivered");

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-foreground mb-6">My Orders</h1>

          <Tabs defaultValue="active">
            <TabsList className="w-full justify-start mb-6">
              <TabsTrigger value="active" className="flex-1 md:flex-none">
                Active ({activeOrders.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex-1 md:flex-none">
                Completed ({completedOrders.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {activeOrders.length === 0 ? (
                <div className="text-center py-16">
                  <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No active orders
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Your active orders will appear here
                  </p>
                  <Link to="/laundries">
                    <Button>Find Laundries</Button>
                  </Link>
                </div>
              ) : (
                activeOrders.map((order) => (
                  <Link key={order.id} to={`/tracking/${order.id}`}>
                    <Card variant="interactive" className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <img
                            src={order.image}
                            alt={order.laundry}
                            className="w-16 h-16 rounded-xl object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <h3 className="font-semibold text-foreground truncate">
                                {order.laundry}
                              </h3>
                              <Badge variant={statusColors[order.status]}>
                                {order.statusLabel}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              {order.items}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                {order.id} • {order.date}
                              </span>
                              <span className="font-semibold text-primary">
                                ${order.total.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground self-center" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <img
                        src={order.image}
                        alt={order.laundry}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-semibold text-foreground truncate">
                            {order.laundry}
                          </h3>
                          <Badge variant="success">
                            <Check className="h-3 w-3 mr-1" />
                            {order.statusLabel}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {order.items}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {order.id} • {order.date}
                          </span>
                          <span className="font-semibold">
                            ${order.total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                      <Button variant="outline" size="sm" className="flex-1">
                        Reorder
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Rate Order
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Orders;
