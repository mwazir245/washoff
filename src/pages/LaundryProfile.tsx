import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Phone,
  Truck,
  Heart,
  Share2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/layout/Layout";
import ServiceCard from "@/components/laundry/ServiceCard";
import { useLanguage } from "@/contexts/LanguageContext";

const mockLaundry = {
  id: "1",
  name: "Fresh & Clean Laundry",
  image: "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=800&h=400&fit=crop",
  rating: 4.8,
  reviewCount: 124,
  distance: "0.5 km",
  deliveryTime: "2-3 hrs",
  address: "123 Main Street, Downtown",
  phone: "+1 (555) 123-4567",
  workingHours: "8:00 AM - 10:00 PM",
  isOpen: true,
  description: "Professional laundry service with 10+ years of experience. We take care of your clothes like they're our own.",
};

const mockServices = [
  {
    id: "1",
    name: "Regular Washing",
    description: "Machine wash with premium detergent",
    price: 3.5,
    unit: "kg",
    icon: "🧺",
  },
  {
    id: "2",
    name: "Ironing",
    description: "Professional ironing service",
    price: 2.0,
    unit: "item",
    icon: "👔",
  },
  {
    id: "3",
    name: "Dry Cleaning",
    description: "For delicate fabrics and formal wear",
    price: 8.0,
    unit: "item",
    icon: "✨",
  },
  {
    id: "4",
    name: "Express Wash",
    description: "Get your clothes back in 4 hours",
    price: 5.0,
    unit: "kg",
    icon: "⚡",
  },
  {
    id: "5",
    name: "Bedding & Linens",
    description: "Sheets, blankets, and duvet covers",
    price: 12.0,
    unit: "item",
    icon: "🛏️",
  },
];

const mockReviews = [
  {
    id: "1",
    user: "Sarah M.",
    rating: 5,
    date: "2 days ago",
    comment: "Excellent service! My clothes came back perfectly clean and pressed.",
  },
  {
    id: "2",
    user: "John D.",
    rating: 4,
    date: "1 week ago",
    comment: "Good quality, reasonable prices. Delivery was on time.",
  },
  {
    id: "3",
    user: "Emily R.",
    rating: 5,
    date: "2 weeks ago",
    comment: "Best laundry service in the area. Highly recommend!",
  },
];

const LaundryProfile = () => {
  const { id } = useParams();
  const [cart, setCart] = useState<Record<string, number>>({});
  const { t } = useLanguage();

  const addToCart = (serviceId: string) => {
    setCart((prev) => ({
      ...prev,
      [serviceId]: (prev[serviceId] || 0) + 1,
    }));
  };

  const removeFromCart = (serviceId: string) => {
    setCart((prev) => {
      const newQty = (prev[serviceId] || 0) - 1;
      if (newQty <= 0) {
        const { [serviceId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [serviceId]: newQty };
    });
  };

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(cart).reduce((total, [serviceId, qty]) => {
    const service = mockServices.find((s) => s.id === serviceId);
    return total + (service?.price || 0) * qty;
  }, 0);

  return (
    <Layout showBottomNav={false}>
      <div className="min-h-screen bg-background pb-24">
        {/* Hero Image */}
        <div className="relative h-64 md:h-80">
          <img
            src={mockLaundry.image}
            alt={mockLaundry.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          
          {/* Back Button */}
          <div className="absolute top-4 left-4 right-4 flex justify-between">
            <Link to="/laundries">
              <Button variant="glass" size="icon" className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex gap-2">
              <Button variant="glass" size="icon" className="rounded-full">
                <Heart className="h-5 w-5" />
              </Button>
              <Button variant="glass" size="icon" className="rounded-full">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="container mx-auto px-4 -mt-16 relative z-10">
          <Card className="shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold text-foreground">
                      {mockLaundry.name}
                    </h1>
                    {mockLaundry.isOpen ? (
                      <Badge variant="success">Open</Badge>
                    ) : (
                      <Badge variant="muted">Closed</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">{mockLaundry.description}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-warning text-warning" />
                  <span className="font-semibold">{mockLaundry.rating}</span>
                  <span className="text-muted-foreground">
                    ({mockLaundry.reviewCount} reviews)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{mockLaundry.distance}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Truck className="h-4 w-4" />
                  <span>{mockLaundry.deliveryTime}</span>
                </div>
              </div>

              {/* Details */}
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{mockLaundry.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{mockLaundry.workingHours}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>{mockLaundry.phone}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="services" className="mt-6">
            <TabsList className="w-full justify-start bg-card border border-border">
              <TabsTrigger value="services" className="flex-1 md:flex-none">
                Services
              </TabsTrigger>
              <TabsTrigger value="reviews" className="flex-1 md:flex-none">
                Reviews
              </TabsTrigger>
            </TabsList>

            <TabsContent value="services" className="mt-6">
              <div className="space-y-4">
                {mockServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    {...service}
                    quantity={cart[service.id] || 0}
                    onAdd={() => addToCart(service.id)}
                    onRemove={() => removeFromCart(service.id)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <div className="space-y-4">
                {mockReviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                            {review.user[0]}
                          </div>
                          <div>
                            <p className="font-medium">{review.user}</p>
                            <p className="text-xs text-muted-foreground">
                              {review.date}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <Star
                              key={i}
                              className="h-4 w-4 fill-warning text-warning"
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-muted-foreground">{review.comment}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Floating Cart */}
        {totalItems > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-card/95 backdrop-blur-md border-t border-border shadow-lg animate-slide-up">
            <div className="container mx-auto">
              <Link to={`/order/${id}`}>
                <Button size="lg" className="w-full justify-between">
                  <span>
                    {totalItems} item{totalItems > 1 ? "s" : ""} · {totalPrice.toFixed(2)} {t("currency.symbol")}
                  </span>
                  <span className="flex items-center gap-2">
                    Continue <ChevronRight className="h-4 w-4" />
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LaundryProfile;
