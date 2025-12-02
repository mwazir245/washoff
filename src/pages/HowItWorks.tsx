import { Link } from "react-router-dom";
import {
  MapPin,
  Calendar,
  Truck,
  Sparkles,
  Clock,
  Shield,
  CreditCard,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout/Layout";

const steps = [
  {
    number: "01",
    icon: MapPin,
    title: "Find Nearby Laundries",
    description:
      "Enter your location and discover trusted laundry services in your area. Compare prices, ratings, and services.",
  },
  {
    number: "02",
    icon: Calendar,
    title: "Schedule Pickup",
    description:
      "Choose your preferred pickup time. Our driver will come to collect your clothes at your convenience.",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Professional Cleaning",
    description:
      "Your clothes are handled with care by professional laundry services. Track your order in real-time.",
  },
  {
    number: "04",
    icon: Truck,
    title: "Delivered Fresh",
    description:
      "Receive your freshly cleaned clothes at your doorstep. Rate your experience and enjoy the freshness!",
  },
];

const features = [
  {
    icon: Clock,
    title: "Same Day Service",
    description: "Get your clothes back within hours with express options.",
  },
  {
    icon: Shield,
    title: "Quality Guarantee",
    description: "All our partner laundries are verified and quality-checked.",
  },
  {
    icon: CreditCard,
    title: "Flexible Payments",
    description: "Pay with card, Apple Pay, or cash on delivery.",
  },
  {
    icon: Smartphone,
    title: "Real-time Tracking",
    description: "Track your order status from pickup to delivery.",
  },
];

const HowItWorks = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="bg-gradient-hero py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <Badge variant="soft" className="mb-4">
              Simple & Easy
            </Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              How <span className="text-gradient">Wash Off</span> Works
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Fresh, clean clothes delivered to your door in 4 simple steps.
              No hassle, no waiting in line.
            </p>
          </div>
        </section>

        {/* Steps */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {steps.map((step, index) => (
                <div
                  key={step.number}
                  className={`flex flex-col md:flex-row gap-8 items-center mb-16 last:mb-0 ${
                    index % 2 === 1 ? "md:flex-row-reverse" : ""
                  }`}
                >
                  <div className="flex-1">
                    <div className="text-6xl font-bold text-primary/20 mb-4">
                      {step.number}
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-3">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-48 h-48 rounded-3xl bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center shadow-card">
                      <step.icon className="h-20 w-20 text-primary" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 md:py-24 bg-card">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Why Choose Wash Off?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                We make laundry simple, reliable, and convenient for you.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} className="text-center">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <feature.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24 bg-secondary text-secondary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-secondary-foreground/80 mb-8 max-w-xl mx-auto">
              Join thousands of happy customers who trust Wash Off for their laundry needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/laundries">
                <Button
                  size="xl"
                  className="bg-primary-foreground text-secondary hover:bg-primary-foreground/90"
                >
                  Find Laundries Near Me
                </Button>
              </Link>
              <Link to="/auth?mode=signup">
                <Button
                  variant="outline"
                  size="xl"
                  className="border-secondary-foreground/50 text-secondary-foreground hover:bg-secondary-foreground/10"
                >
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default HowItWorks;
