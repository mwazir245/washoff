import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Clock,
  Phone,
  Mail,
  FileText,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/logo.png";

const defaultServices = [
  { name: "Regular Washing", price: "" },
  { name: "Ironing", price: "" },
  { name: "Dry Cleaning", price: "" },
];

const ProviderRegister = () => {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState(defaultServices);
  const [isLoading, setIsLoading] = useState(false);

  const addService = () => {
    setServices([...services, { name: "", price: "" }]);
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      setIsLoading(true);
      // Simulate submission
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Wash Off" className="h-8 w-auto" />
              <span className="text-lg font-bold text-secondary">Wash Off</span>
            </Link>
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-20 h-1 ${
                      step > s ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <Card className="shadow-xl">
            <form onSubmit={handleSubmit}>
              {/* Step 1: Business Info */}
              {step === 1 && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      Business Information
                    </CardTitle>
                    <CardDescription>
                      Tell us about your laundry business
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input
                        id="businessName"
                        placeholder="Enter your business name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="registration">Commercial Registration Number</Label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="registration"
                          placeholder="Enter registration number"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Business Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter business email"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Contact Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="Enter contact number"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Business Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Tell customers about your services..."
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </>
              )}

              {/* Step 2: Location & Hours */}
              {step === 2 && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Location & Working Hours
                    </CardTitle>
                    <CardDescription>
                      Set your business location and availability
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">Business Address</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="address"
                          placeholder="Enter your business address"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    {/* Map placeholder */}
                    <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Pin your location on the map
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="openTime">Opening Time</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="openTime"
                            type="time"
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="closeTime">Closing Time</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="closeTime"
                            type="time"
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Working Days</Label>
                      <div className="flex flex-wrap gap-2">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                          (day) => (
                            <Badge
                              key={day}
                              variant="outline"
                              className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                            >
                              {day}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  </CardContent>
                </>
              )}

              {/* Step 3: Services */}
              {step === 3 && (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      ✨ Services & Pricing
                    </CardTitle>
                    <CardDescription>
                      Add the services you offer and set your prices
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {services.map((service, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                      >
                        <Input
                          placeholder="Service name"
                          value={service.name}
                          onChange={(e) => {
                            const newServices = [...services];
                            newServices[index].name = e.target.value;
                            setServices(newServices);
                          }}
                          className="flex-1"
                        />
                        <Input
                          placeholder="Price"
                          type="number"
                          value={service.price}
                          onChange={(e) => {
                            const newServices = [...services];
                            newServices[index].price = e.target.value;
                            setServices(newServices);
                          }}
                          className="w-24"
                        />
                        {services.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeService(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={addService}
                      className="w-full gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Service
                    </Button>
                  </CardContent>
                </>
              )}

              {/* Navigation */}
              <CardContent className="flex justify-between pt-6 border-t border-border">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                  >
                    Back
                  </Button>
                ) : (
                  <div />
                )}
                <Button type="submit" disabled={isLoading}>
                  {step < 3
                    ? "Continue"
                    : isLoading
                    ? "Submitting..."
                    : "Submit Application"}
                </Button>
              </CardContent>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ProviderRegister;
