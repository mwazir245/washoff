import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildWashoffApiAuthHeaders } from "@/features/orders/infrastructure/adapters/api-auth";

interface OnboardingDocumentDownloadButtonProps {
  downloadPath?: string;
  fileName: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  className?: string;
}

const OnboardingDocumentDownloadButton = ({
  downloadPath,
  fileName,
  variant = "outline",
  className,
}: OnboardingDocumentDownloadButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!downloadPath) {
      setErrorMessage("لا يتوفر مسار تنزيل لهذا المستند حالياً.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const response = await fetch(downloadPath, {
        method: "GET",
        headers: buildWashoffApiAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("تعذر تنزيل المستند المطلوب حالياً.");
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = fileName;
      anchor.target = "_blank";
      anchor.rel = "noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "تعذر تنزيل المستند المطلوب حالياً.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button type="button" variant={variant} className={className} onClick={handleDownload} disabled={isLoading}>
        {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {isLoading ? "جارٍ فتح المستند..." : "عرض المستند"}
      </Button>
      {errorMessage ? <p className="text-xs text-destructive">{errorMessage}</p> : null}
    </div>
  );
};

export default OnboardingDocumentDownloadButton;
