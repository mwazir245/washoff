import { Plus, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface ServiceCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  icon: string;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}

const ServiceCard = ({
  name,
  description,
  price,
  unit,
  icon,
  quantity,
  onAdd,
  onRemove,
}: ServiceCardProps) => {
  const { t, isRTL } = useLanguage();
  
  return (
    <Card variant="default" className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="text-4xl">{icon}</div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground">{name}</h4>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {description}
            </p>
            <div className="flex items-center justify-between mt-3">
              <div className="text-primary font-semibold">
                {price.toFixed(2)} {t("currency.symbol")} <span className="text-sm text-muted-foreground font-normal">/ {unit}</span>
              </div>
              
              {quantity === 0 ? (
                <Button size="sm" onClick={onAdd} className="h-8">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onRemove}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-semibold">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onAdd}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceCard;
