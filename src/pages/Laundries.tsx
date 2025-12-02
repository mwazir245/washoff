import { useState } from "react";
import { Search, Filter, MapPin, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Layout from "@/components/layout/Layout";
import LaundryCard from "@/components/laundry/LaundryCard";
import { useLanguage } from "@/contexts/LanguageContext";

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
  {
    id: "4",
    name: "Quick Clean Express",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
    rating: 4.5,
    reviewCount: 67,
    distance: "2.1 km",
    deliveryTime: "4-5 hrs",
    services: ["Washing", "Ironing"],
    priceRange: "$",
    hasDelivery: false,
    isOpen: true,
  },
  {
    id: "5",
    name: "Luxury Fabric Care",
    image: "https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?w=400&h=300&fit=crop",
    rating: 4.7,
    reviewCount: 156,
    distance: "2.5 km",
    deliveryTime: "Same day",
    services: ["Dry Clean", "Alterations", "Leather Care"],
    priceRange: "$$$",
    hasDelivery: true,
    isOpen: true,
  },
  {
    id: "6",
    name: "Eco Wash Hub",
    image: "https://images.unsplash.com/photo-1567113463300-102a7eb3cb26?w=400&h=300&fit=crop",
    rating: 4.4,
    reviewCount: 45,
    distance: "3.0 km",
    deliveryTime: "Next day",
    services: ["Washing", "Eco Clean"],
    priceRange: "$$",
    hasDelivery: true,
    isOpen: true,
  },
];

const Laundries = () => {
  const { t, isRTL } = useLanguage();
  const [search, setSearch] = useState("");
  const [selectedService, setSelectedService] = useState("All");
  const [selectedSort, setSelectedSort] = useState("Nearest");
  const [showFilters, setShowFilters] = useState(false);

  const serviceFilters = [
    { key: "All", label: t("laundries.all") },
    { key: "Washing", label: t("service.washing") },
    { key: "Ironing", label: t("service.ironing") },
    { key: "Dry Clean", label: t("service.dryClean") },
    { key: "Alterations", label: t("service.alterations") },
  ];

  const sortOptions = [
    { key: "Nearest", label: t("laundries.nearest") },
    { key: "Top Rated", label: t("laundries.topRated") },
    { key: "Fastest", label: t("laundries.fastest") },
    { key: "Price: Low to High", label: t("laundries.priceLowHigh") },
  ];

  const filteredLaundries = mockLaundries.filter((laundry) => {
    const matchesSearch = laundry.name.toLowerCase().includes(search.toLowerCase());
    const matchesService = selectedService === "All" || laundry.services.includes(selectedService);
    return matchesSearch && matchesService;
  });

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header Section */}
        <div className="bg-card border-b border-border sticky top-16 z-40">
          <div className="container mx-auto px-4 py-4">
            {/* Search Bar */}
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                <Input
                  placeholder={t("laundries.searchPlaceholder")}
                  className={isRTL ? 'pr-10' : 'pl-10'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button
                variant={showFilters ? "default" : "outline"}
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-5 w-5" />
              </Button>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <MapPin className="h-4 w-4 text-primary" />
              <span>{t("laundries.deliveringTo")} </span>
              <span className="text-foreground font-medium">{t("laundries.currentLocation")}</span>
              <Button variant="link" size="sm" className="h-auto p-0 text-primary">
                {t("action.change")}
              </Button>
            </div>

            {/* Service Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {serviceFilters.map((service) => (
                <Badge
                  key={service.key}
                  variant={selectedService === service.key ? "default" : "outline"}
                  className="cursor-pointer whitespace-nowrap px-4 py-1.5"
                  onClick={() => setSelectedService(service.key)}
                >
                  {service.label}
                </Badge>
              ))}
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <Card className="mt-4 p-4 animate-slide-up">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">{t("laundries.sortBy")}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sortOptions.map((option) => (
                    <Badge
                      key={option.key}
                      variant={selectedSort === option.key ? "default" : "outline"}
                      className="cursor-pointer px-3 py-1.5"
                      onClick={() => setSelectedSort(option.key)}
                    >
                      {option.label}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              {filteredLaundries.length} {t("laundries.title")}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLaundries.map((laundry, index) => (
              <div
                key={laundry.id}
                className="animate-scale-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <LaundryCard {...laundry} />
              </div>
            ))}
          </div>

          {filteredLaundries.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {t("laundries.noResults")}
              </h3>
              <p className="text-muted-foreground">
                {t("laundries.noResultsDesc")}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Laundries;
