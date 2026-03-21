import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlatformLanguage } from "@/features/content/hooks/usePlatformLanguage";
import { cn } from "@/lib/utils";

interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const buildPageRange = (currentPage: number, totalPages: number) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, 5, -1, totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, -1, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages];
};

const PaginationBar = ({ currentPage, totalPages, onPageChange, className }: PaginationBarProps) => {
  const { language } = usePlatformLanguage();
  const pages = buildPageRange(currentPage, totalPages);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <p className="text-sm text-muted-foreground">
        {language === "en"
          ? `Page ${currentPage} of ${totalPages}`
          : `الصفحة ${currentPage} من ${totalPages}`}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="gap-2"
        >
          <ChevronRight className="h-4 w-4" />
          {language === "en" ? "Previous" : "السابق"}
        </Button>

        {pages.map((page, index) =>
          page === -1 ? (
            <span key={`ellipsis-${index}`} className="px-2 text-sm text-muted-foreground">
              ...
            </span>
          ) : (
            <Button
              key={page}
              type="button"
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              className={cn("min-w-10", page === currentPage && "shadow-sm")}
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          ),
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="gap-2"
        >
          {language === "en" ? "Next" : "التالي"}
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default PaginationBar;
