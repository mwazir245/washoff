import type { KeyboardEvent, ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface DataTableColumn<Row> {
  key: string;
  header: ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  cell: (row: Row) => ReactNode;
}

interface DataTableProps<Row> {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  getRowKey: (row: Row) => string;
  onRowClick?: (row: Row) => void;
  emptyState: ReactNode;
  rowClassName?: string;
  className?: string;
}

export const DataTable = <Row,>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  emptyState,
  rowClassName,
  className,
}: DataTableProps<Row>) => {
  const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, row: Row) => {
    if (!onRowClick) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onRowClick(row);
    }
  };

  return (
    <div className={cn("overflow-hidden rounded-[1.5rem] border border-border/70 bg-white/90", className)}>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn("whitespace-nowrap text-start text-xs font-semibold tracking-[0.08em]", column.headerClassName)}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((row) => (
              <TableRow
                key={getRowKey(row)}
                className={cn(
                  onRowClick ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" : "",
                  rowClassName,
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={(event) => handleRowKeyDown(event, row)}
                tabIndex={onRowClick ? 0 : undefined}
              >
                {columns.map((column) => (
                  <TableCell key={column.key} className={cn("align-top text-start", column.cellClassName)}>
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="px-6 py-10">
                {emptyState}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default DataTable;
