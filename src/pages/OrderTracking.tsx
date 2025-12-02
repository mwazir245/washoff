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
import { useLanguage } from "@/contexts/LanguageContext";

const OrderTracking = () => {
  const { orderId } = useParams();
  const { t, isRTL } = useLanguage();
  const [currentStatus, setCurrentStatus] = useState(3); // washing

  const orderStatuses = [
    {
      id: "received",
      label: t("status.orderReceived"),
      description: t("status.orderReceived"),
      time: "10:30 AM",
      completed: true,
      current: false,
    },
    {
      id: "pickup",
      label: t("status.onWayPickup"),
      description: t("status.onWayPickup"),
      time: "10:45 AM",
      completed: true,
      current: false,
    },
    {
      id: "collected",
      label: t("status.clothesCollected"),
      description: t("status.clothesCollected"),
      time: "11:15 AM",
      completed: true,
      current: false,
    },
    {
      id: "washing",
      label: t("status.inWashing"),
      description: t("status.inWashing"),
      time: "",
      completed: false,
      current: true,
    },
    {
      id: "ironing",
      label: t("status.inIroning"),
      description: t("status.inIroning"),
      time: "",
      completed: false,
      current: false,
    },
    {
      id: "ready",
      label: t("status.ready"),
      description: t("status.ready"),
      time: "",
      completed: false,
      current: false,
    },
    {
      id: "out_delivery",
      label: t("status.outForDelivery"),
      description: t("status.outForDelivery"),
      time: "",
      completed: false,
      current: false,
    },
    {
      id: "delivered",
      label: t("status.delivered"),
      description: t("status.delivered"),
      time: "",
      completed: false,
      current: false,
    },
  ];

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
  }, [orderStatuses.length]);

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
                    <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-lg font-semibold">{t("nav.orders")} #{orderId?.slice(0, 8)}</h1>
                  <p className="text-sm text-muted-foreground">
                    {t("tracking.estimatedDelivery")}: {t("tracking.today")}, 6:00 PM
                  </p>
                </div>
              </div>
              <Badge variant="success">{t("tracking.inProgress")}</Badge>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Status Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("tracking.orderStatus")}</CardTitle>
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
                    <p className="text-muted-foreground">{t("tracking.liveMap")}</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Laundry Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("tracking.laundryService")}</CardTitle>
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
                      {t("action.call")}
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-2">
                      <MessageSquare className="h-4 w-4" />
                      {t("action.chat")}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Partner */}
              {currentStatus >= 6 && (
                <Card className="animate-scale-in">
                  <CardHeader>
                    <CardTitle className="text-base">{t("tracking.deliveryPartner")}</CardTitle>
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
                          <span>{t("tracking.onTheWay")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1 gap-2">
                        <Phone className="h-4 w-4" />
                        {t("action.call")}
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 gap-2">
                        <MessageSquare className="h-4 w-4" />
                        {t("action.chat")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Order Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("tracking.orderDetails")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("service.washing")} x 3 kg</span>
                    <span>10.50 {t("currency.symbol")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("service.ironing")} x 5</span>
                    <span>10.00 {t("currency.symbol")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("order.deliveryFee")}</span>
                    <span>2.00 {t("currency.symbol")}</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between font-semibold">
                    <span>{t("order.total")}</span>
                    <span className="text-primary">22.50 {t("currency.symbol")}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    {t("order.deliveryAddress")}
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
