import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LoaderCircle, LocateFixed, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HotelLocationPickerProps {
  latitude?: number;
  longitude?: number;
  onChange: (coordinates: { latitude: number; longitude: number }) => void;
}

type GeolocationState = "idle" | "detecting" | "granted" | "denied" | "unsupported";

const DEFAULT_CENTER = {
  latitude: 24.7136,
  longitude: 46.6753,
};

const SAUDI_BOUNDS = L.latLngBounds(
  L.latLng(16.0, 34.0),
  L.latLng(32.5, 56.0),
);

const formatCoordinate = (value?: number) =>
  typeof value === "number" && Number.isFinite(value) ? value.toFixed(6) : "غير محدد";

const HotelLocationPicker = ({
  latitude,
  longitude,
  onChange,
}: HotelLocationPickerProps) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const [geolocationState, setGeolocationState] = useState<GeolocationState>("idle");

  const hasSelectedLocation =
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    typeof longitude === "number" &&
    Number.isFinite(longitude);

  const selectedCoordinates = useMemo(
    () => ({
      latitude: hasSelectedLocation ? latitude : undefined,
      longitude: hasSelectedLocation ? longitude : undefined,
    }),
    [hasSelectedLocation, latitude, longitude],
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const initialCenter = hasSelectedLocation
      ? L.latLng(latitude!, longitude!)
      : L.latLng(DEFAULT_CENTER.latitude, DEFAULT_CENTER.longitude);

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: hasSelectedLocation ? 15 : 6,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    map.setMaxBounds(SAUDI_BOUNDS.pad(0.4));

    const updateMarker = (nextLatitude: number, nextLongitude: number) => {
      const nextLatLng = L.latLng(nextLatitude, nextLongitude);

      if (!markerRef.current) {
        markerRef.current = L.circleMarker(nextLatLng, {
          radius: 10,
          color: "#0d4fd7",
          weight: 3,
          fillColor: "#0d4fd7",
          fillOpacity: 0.25,
        }).addTo(map);
      } else {
        markerRef.current.setLatLng(nextLatLng);
      }

      map.panTo(nextLatLng, { animate: true });
      onChange({ latitude: nextLatitude, longitude: nextLongitude });
    };

    if (hasSelectedLocation) {
      updateMarker(latitude!, longitude!);
    }

    map.on("click", (event: L.LeafletMouseEvent) => {
      updateMarker(event.latlng.lat, event.latlng.lng);
    });

    mapRef.current = map;

    window.setTimeout(() => {
      map.invalidateSize();
    }, 0);

    return () => {
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [hasSelectedLocation, latitude, longitude, onChange]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !hasSelectedLocation) {
      return;
    }

    const nextLatLng = L.latLng(latitude!, longitude!);
    if (!markerRef.current) {
      markerRef.current = L.circleMarker(nextLatLng, {
        radius: 10,
        color: "#0d4fd7",
        weight: 3,
        fillColor: "#0d4fd7",
        fillOpacity: 0.25,
      }).addTo(map);
    } else {
      markerRef.current.setLatLng(nextLatLng);
    }

    map.setView(nextLatLng, Math.max(map.getZoom(), 15));
  }, [hasSelectedLocation, latitude, longitude]);

  const locateUser = () => {
    if (!navigator.geolocation) {
      setGeolocationState("unsupported");
      return;
    }

    setGeolocationState("detecting");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLatitude = position.coords.latitude;
        const nextLongitude = position.coords.longitude;
        setGeolocationState("granted");
        onChange({ latitude: nextLatitude, longitude: nextLongitude });

        if (mapRef.current) {
          const nextLatLng = L.latLng(nextLatitude, nextLongitude);
          mapRef.current.setView(nextLatLng, 15);
        }
      },
      () => {
        setGeolocationState("denied");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  };

  useEffect(() => {
    if (!hasSelectedLocation) {
      locateUser();
    }
    // Intentionally only on first render of the map step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <div className="accent-panel flex items-start gap-3 px-4 py-4 text-sm leading-7 text-muted-foreground">
        <MapPinned className="mt-1 h-5 w-5 text-primary" />
        <div className="space-y-2">
          <p className="font-semibold text-foreground">
            حدد موقع الفندق على الخريطة. سيتم استخدام الموقع لتسهيل التشغيل والاستلام.
          </p>
          <p>
            عند فتح هذه الخطوة سنحاول تحديد موقعك الحالي تلقائيًا. ويمكنك دائمًا تغيير النقطة
            يدويًا بالضغط على الخريطة.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.4rem] border border-border/80 bg-background">
        <div ref={mapContainerRef} className="h-[320px] w-full" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.1rem] border border-border/70 bg-muted/20 px-4 py-4">
        <div className="space-y-1 text-sm">
          <p className="font-semibold text-foreground">
            خط العرض: {formatCoordinate(selectedCoordinates.latitude)}
          </p>
          <p className="font-semibold text-foreground">
            خط الطول: {formatCoordinate(selectedCoordinates.longitude)}
          </p>
          <p className="text-muted-foreground">
            {geolocationState === "detecting" && "جارٍ محاولة تحديد موقعك الحالي..."}
            {geolocationState === "granted" && "تم استخدام موقعك الحالي كنقطة أولية، ويمكنك تعديلها."}
            {geolocationState === "denied" && "تعذر الوصول إلى موقعك الحالي. اختر النقطة يدويًا من الخريطة."}
            {geolocationState === "unsupported" && "المتصفح لا يدعم تحديد الموقع. اختر النقطة يدويًا من الخريطة."}
            {geolocationState === "idle" && "اختر النقطة المناسبة لموقع الفندق على الخريطة."}
          </p>
        </div>

        <Button type="button" variant="outline" onClick={locateUser}>
          {geolocationState === "detecting" ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <LocateFixed className="h-4 w-4" />
          )}
          استخدام موقعي الحالي
        </Button>
      </div>
    </div>
  );
};

export default HotelLocationPicker;
