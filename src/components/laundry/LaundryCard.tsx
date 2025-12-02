import { Link } from "react-router-dom";
import { Star, MapPin, Clock, Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

interface LaundryCardProps {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviewCount: number;
  distance: string;
  deliveryTime: string;
  services: string[];
  priceRange: string;
  hasDelivery: boolean;
  isOpen: boolean;
}

const LaundryCard = ({
  id,
  name,
  image,
  rating,
  reviewCount,
  distance,
  deliveryTime,
  services,
  priceRange,
  hasDelivery,
  isOpen,
}: LaundryCardProps) => {
  const { t, isRTL } = useLanguage();

  const getServiceTranslation = (service: string) => {
    const serviceMap: Record<string, string> = {
      "Washing": t("service.washing"),
      "Ironing": t("service.ironing"),
      "Dry Clean": t("service.dryClean"),
      "Alterations": t("service.alterations"),
    };
    return serviceMap[service] || service;
  };

  return (
    <Link to={`/laundry/${id}`}>
      <Card variant="interactive" className="overflow-hidden group">
        <div className="relative">
          <img
            src={image}
            alt={name}
            className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} flex gap-2`}>
            {isOpen ? (
              <Badge variant="success">{t("laundry.open")}</Badge>
            ) : (
              <Badge variant="muted">{t("laundry.closed")}</Badge>
            )}
            {hasDelivery && (
              <Badge variant="soft" className="gap-1">
                <Truck className="h-3 w-3" />
                {t("laundry.delivery")}
              </Badge>
            )}
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-foreground line-clamp-1">{name}</h3>
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-warning text-warning" />
              <span className="font-medium">{rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({reviewCount})</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1 mb-3">
            {services.slice(0, 3).map((service) => (
              <Badge key={service} variant="outline" className="text-xs">
                {getServiceTranslation(service)}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{distance}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{deliveryTime}</span>
            </div>
            <span className="font-medium text-foreground">{priceRange}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default LaundryCard;
