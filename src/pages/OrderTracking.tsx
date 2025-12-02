import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  MapPin,
  Clock,
  User,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout/Layout";
import OrderStatusTimeline from "@/components/order/OrderStatusTimeline";

const orderStatuses = [
  {
    id: "received",
    label: "Order Received",
    description: "Your order has been confirmed",
    time: "10:30 AM",
    completed: true,
    current: false,
  },
  {
    id: "pickup",
    label: "On the Way to Pickup",
    description: "Driver is heading to your location",
    time: "10:45 AM",
    completed: true,
    current: false,
  },
  {
    id: "collected",
    label: "Clothes Collected",
    description: "Your clothes have been picked up",
    time: "11:15 AM",
    completed: true,
    current: false,
  },
  {
    id: "washing",
    label: "In Washing",
    description: "Your clothes are being washed",
    time: "",
    completed: false,
    current: true,
  },
  {
    id: "ironing",
    label: "In Ironing",
    description: "Your clothes are being pressed",
    time: "",
    completed: false,
    current: false,
  },
  {
    id: "ready",
    label: "Ready",
    description: "Your order is ready for delivery",
    time: "",
    completed: false,
    current: false,
  },
  {
    id: "out_delivery",
    label: "Out for Delivery",
    description: "Your clothes are on the way",
    time: "",
    completed: false,
    current: false,
  },
  {
    id: "delivered",
    label: "Delivered",
    description: "Your order has been delivered",
    time: "",
    completed: false,
    current: false,
  },
];

const OrderTracking = () => {
  const { orderId } = useParams();
  const [currentStatus, setCurrentStatus] = useState(3); // washing

  // Simulate status updates
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStatus((prev) => {
        if (prev < orderStatuses.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 10000); // Update every 10 seconds for demo

    return () => clearInterval(timer);
  }, []);

  const statuses = orderStatuses.map((status, index) => ({
    ...status,
    completed: index < currentStatus,
    current: index === currentStatus,
    time: index < currentStatus ? status.time || "Just now" : "",
  }));

  return (
    <Layout showBottomNav={false}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-card border-b border-border sticky top-16 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link to="/">
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-lg font-semibold">Order #{orderId?.slice(0, 8)}</h1>
                  <p className="text-sm text-muted-foreground">
                    Estimated delivery: Today, 6:00 PM
                  </p>
                </div>
              </div>
              <Badge variant="success">In Progress</Badge>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Status Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <OrderStatusTimeline statuses={statuses} />
                </CardContent>
              </Card>

              {/* Map placeholder */}
              <Card className="overflow-hidden">
                <div className="h-64 bg-muted flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-primary mx-auto mb-2" />
                    <p className="text-muted-foreground">Live tracking map</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Laundry Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Laundry Service</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <img
                      src="https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=100&h=100&fit=crop"
                      alt="Fresh & Clean Laundry"
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold">Fresh & Clean Laundry</h4>
                      <p className="text-sm text-muted-foreground">
                        123 Main Street
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1 gap-2">
                      <Phone className="h-4 w-4" />
                      Call
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Partner */}
              {currentStatus >= 6 && (
                <Card className="animate-scale-in">
                  <CardHeader>
                    <CardTitle className="text-base">Delivery Partner</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">Ahmed M.</h4>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Truck className="h-4 w-4" />
                          <span>On the way</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1 gap-2">
                        <Phone className="h-4 w-4" />
                        Call
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Chat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Order Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Order Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Regular Washing x 3 kg</span>
                    <span>$10.50</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ironing x 5 items</span>
                    <span>$10.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span>$2.00</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-primary">$22.50</span>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    123 Main Street, Apt 4B
                    <br />
                    Downtown District
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderTracking;
