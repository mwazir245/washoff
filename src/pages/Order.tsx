import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  CreditCard,
  Apple,
  Banknote,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout/Layout";

const mockOrder = {
  items: [
    { name: "Regular Washing", qty: 3, price: 3.5, unit: "kg" },
    { name: "Ironing", qty: 5, price: 2.0, unit: "items" },
  ],
  subtotal: 20.5,
  deliveryFee: 2.0,
  total: 22.5,
};

const timeSlots = [
  "9:00 AM - 11:00 AM",
  "11:00 AM - 1:00 PM",
  "1:00 PM - 3:00 PM",
  "3:00 PM - 5:00 PM",
  "5:00 PM - 7:00 PM",
];

const Order = () => {
  const navigate = useNavigate();
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [address, setAddress] = useState("123 Main Street, Apt 4B");

  const handlePlaceOrder = () => {
    navigate("/tracking/order123");
  };

  return (
    <Layout showBottomNav={false}>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="bg-card border-b border-border sticky top-16 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link to="/laundries">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-xl font-semibold">Checkout</h1>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Delivery Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your address"
                  />
                  <Button variant="link" className="mt-2 p-0 h-auto text-primary">
                    Use current location
                  </Button>
                </CardContent>
              </Card>

              {/* Pickup Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Pickup Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Pickup Date</Label>
                    <Input
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Pickup Time</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {timeSlots.map((slot) => (
                        <Badge
                          key={slot}
                          variant={pickupTime === slot ? "default" : "outline"}
                          className="cursor-pointer py-2 justify-center"
                          onClick={() => setPickupTime(slot)}
                        >
                          {slot}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Delivery Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Delivery Date</Label>
                    <Input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Delivery Time</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {timeSlots.map((slot) => (
                        <Badge
                          key={slot}
                          variant={deliveryTime === slot ? "default" : "outline"}
                          className="cursor-pointer py-2 justify-center"
                          onClick={() => setDeliveryTime(slot)}
                        >
                          {slot}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                    className="space-y-3"
                  >
                    <div
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors cursor-pointer ${
                        paymentMethod === "card"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setPaymentMethod("card")}
                    >
                      <RadioGroupItem value="card" id="card" />
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <Label htmlFor="card" className="flex-1 cursor-pointer">
                        Credit / Debit Card
                      </Label>
                    </div>
                    <div
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors cursor-pointer ${
                        paymentMethod === "apple"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setPaymentMethod("apple")}
                    >
                      <RadioGroupItem value="apple" id="apple" />
                      <Apple className="h-5 w-5 text-muted-foreground" />
                      <Label htmlFor="apple" className="flex-1 cursor-pointer">
                        Apple Pay / STC Pay
                      </Label>
                    </div>
                    <div
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors cursor-pointer ${
                        paymentMethod === "cash"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setPaymentMethod("cash")}
                    >
                      <RadioGroupItem value="cash" id="cash" />
                      <Banknote className="h-5 w-5 text-muted-foreground" />
                      <Label htmlFor="cash" className="flex-1 cursor-pointer">
                        Cash on Delivery
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-36">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.name} x {item.qty} {item.unit}
                      </span>
                      <span className="font-medium">
                        ${(item.price * item.qty).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  
                  <div className="border-t border-border pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>${mockOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery Fee</span>
                      <span>${mockOrder.deliveryFee.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span className="text-primary">${mockOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Place Order Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-card/95 backdrop-blur-md border-t border-border shadow-lg">
          <div className="container mx-auto">
            <Button
              size="lg"
              className="w-full justify-between"
              onClick={handlePlaceOrder}
            >
              <span>Place Order</span>
              <span className="flex items-center gap-2">
                ${mockOrder.total.toFixed(2)} <ChevronRight className="h-4 w-4" />
              </span>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Order;
