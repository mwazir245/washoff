import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Search, Sparkles, Clock, Shield, Truck, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout/Layout";
import LaundryCard from "@/components/laundry/LaundryCard";
import logo from "@/assets/logo.png";

const mockLaundries = [
  {
    id: "1",
    name: "Fresh & Clean Laundry",
    image: "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=400&h=300&fit=crop",
    rating: 4.8,
    reviewCount: 124,
    distance: "0.5 km",
    deliveryTime: "2-3 hrs",
    services: ["Washing", "Ironing", "Dry Clean"],
    priceRange: "$$",
    hasDelivery: true,
    isOpen: true,
  },
  {
    id: "2",
    name: "Sparkle Wash",
    image: "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=400&h=300&fit=crop",
    rating: 4.6,
    reviewCount: 89,
    distance: "1.2 km",
    deliveryTime: "3-4 hrs",
    services: ["Washing", "Dry Clean"],
    priceRange: "$",
    hasDelivery: true,
    isOpen: true,
  },
  {
    id: "3",
    name: "Premium Garment Care",
    image: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400&h=300&fit=crop",
    rating: 4.9,
    reviewCount: 203,
    distance: "1.8 km",
    deliveryTime: "Same day",
    services: ["Washing", "Ironing", "Dry Clean", "Alterations"],
    priceRange: "$$$",
    hasDelivery: true,
    isOpen: false,
  },
];

const features = [
  {
    icon: Clock,
    title: "Quick Turnaround",
    description: "Get your clothes back clean and fresh within hours",
  },
  {
    icon: Truck,
    title: "Free Pickup & Delivery",
    description: "We come to you - no need to leave your home",
  },
  {
    icon: Shield,
    title: "Quality Guaranteed",
    description: "Professional care for all your garments",
  },
  {
    icon: Sparkles,
    title: "Eco-Friendly",
    description: "Sustainable cleaning practices and products",
  },
];

const Index = () => {
  const [location, setLocation] = useState("");

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero min-h-[600px] flex items-center">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/50 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-6 animate-float">
              <img src={logo} alt="Wash Off" className="h-20 w-auto" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-secondary mb-6 animate-fade-in">
              Laundry Made{" "}
              <span className="text-gradient">Simple</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in">
              Connect with trusted laundry services near you. Fresh, clean clothes delivered to your door.
            </p>

            {/* Search Box */}
            <div className="max-w-xl mx-auto animate-slide-up">
              <Card className="p-2 shadow-xl">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Enter your location"
                      className="pl-10 border-0 shadow-none bg-muted/50"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                  <Link to="/laundries">
                    <Button size="lg" className="w-full sm:w-auto gap-2">
                      <Search className="h-4 w-4" />
                      Find Laundries
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 mt-12 animate-fade-in">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Laundries</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">50K+</div>
                <div className="text-sm text-muted-foreground">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">4.8</div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Star className="h-4 w-4 fill-warning text-warning" /> Average Rating
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="soft" className="mb-4">Why Choose Us</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              The Smarter Way to Do Laundry
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={feature.title}
                variant="glass"
                className="text-center p-6 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Nearby Laundries Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Laundries Near You
              </h2>
              <p className="text-muted-foreground mt-1">
                Top-rated services in your area
              </p>
            </div>
            <Link to="/laundries">
              <Button variant="ghost" className="gap-2">
                View All <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockLaundries.map((laundry, index) => (
              <div
                key={laundry.id}
                className="animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <LaundryCard {...laundry} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="soft" className="mb-4 bg-secondary-foreground/10 text-secondary-foreground">
              How It Works
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold">
              Fresh Clothes in 3 Easy Steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Schedule Pickup", desc: "Choose a time that works for you" },
              { step: "2", title: "We Clean", desc: "Professional care for your garments" },
              { step: "3", title: "Delivered Fresh", desc: "Clean clothes right to your door" },
            ].map((item, index) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary-foreground/10 flex items-center justify-center text-2xl font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-secondary-foreground/80">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/laundries">
              <Button variant="hero" size="xl" className="bg-primary-foreground text-secondary hover:bg-primary-foreground/90">
                Get Started Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <Card className="overflow-hidden bg-gradient-to-br from-primary/5 to-accent/30 border-0">
            <CardContent className="p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                    Own a Laundry Business?
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Join Wash Off and reach thousands of customers looking for quality laundry services. Grow your business with our platform.
                  </p>
                  <Link to="/provider/register">
                    <Button variant="hero" size="lg">
                      Partner With Us
                    </Button>
                  </Link>
                </div>
                <div className="hidden md:flex justify-center">
                  <div className="relative">
                    <div className="w-64 h-64 bg-primary/20 rounded-full absolute -top-8 -right-8 blur-2xl" />
                    <img
                      src="https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=400&h=400&fit=crop"
                      alt="Laundry service"
                      className="relative rounded-2xl shadow-xl w-72 h-72 object-cover"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary text-secondary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={logo} alt="Wash Off" className="h-8 w-auto brightness-0 invert" />
                <span className="text-xl font-bold">Wash Off</span>
              </div>
              <p className="text-secondary-foreground/70 text-sm">
                The smarter way to get your laundry done. Connect with trusted services near you.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Customers</h4>
              <ul className="space-y-2 text-sm text-secondary-foreground/70">
                <li><Link to="/laundries" className="hover:text-secondary-foreground">Find Laundries</Link></li>
                <li><Link to="/how-it-works" className="hover:text-secondary-foreground">How It Works</Link></li>
                <li><Link to="/pricing" className="hover:text-secondary-foreground">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Business</h4>
              <ul className="space-y-2 text-sm text-secondary-foreground/70">
                <li><Link to="/provider/register" className="hover:text-secondary-foreground">Partner With Us</Link></li>
                <li><Link to="/delivery/register" className="hover:text-secondary-foreground">Become a Driver</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-secondary-foreground/70">
                <li><Link to="/help" className="hover:text-secondary-foreground">Help Center</Link></li>
                <li><Link to="/contact" className="hover:text-secondary-foreground">Contact Us</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-secondary-foreground/20 mt-8 pt-8 text-center text-sm text-secondary-foreground/70">
            © 2024 Wash Off. All rights reserved.
          </div>
        </div>
      </footer>
    </Layout>
  );
};

export default Index;
