"use client";

import { memo } from "react";

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => string | number);
  className?: string | ((row: T) => string);
  render?: (row: T) => React.ReactNode;
}

interface AdminTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

function AdminTableComponent<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  emptyMessage = "No data available",
}: AdminTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 font-mono font-bold uppercase border-dashed border-2 border-gray-200">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto bg-white">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-black bg-secondary">
            {columns.map((column, idx) => (
              <th
                key={idx}
                className={`text-left px-4 py-3 text-xs font-black text-black uppercase whitespace-nowrap tracking-wider ${
                  typeof column.className === "string" ? column.className : ""
                }`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((row) => (
            <tr
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`hover:bg-gray-50 transition-colors ${
                onRowClick ? "cursor-pointer" : ""
              }`}
            >
              {columns.map((column, idx) => {
                let cellContent: React.ReactNode = "";
                
                if (column.render) {
                  cellContent = column.render(row);
                } else {
                  try {
                    if (typeof column.accessor === "function") {
                      const result = column.accessor(row);
                      cellContent = result != null ? String(result) : "";
                    } else {
                      // @ts-ignore
                      cellContent = row[column.accessor] != null ? String(row[column.accessor]) : "";
                    }
                  } catch (error) {
                    console.error("Error in accessor:", error);
                    cellContent = "Error";
                  }
                }
                
                const cellClassName = typeof column.className === "function"
                  ? column.className(row)
                  : (column.className || "text-black");
                
                return (
                  <td
                    key={idx}
                    className={`text-left px-4 py-3 text-sm break-words ${cellClassName}`}
                  >
                    {cellContent}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Memoize with strict comparison to prevent infinite loops
export const AdminTable = memo(AdminTableComponent, (prevProps, nextProps) => {
  if (prevProps.data !== nextProps.data) return false;
  if (prevProps.columns !== nextProps.columns) return false;
  if (prevProps.onRowClick !== nextProps.onRowClick) return false;
  return true;
}) as <T extends { id: string }>(props: AdminTableProps<T>) => JSX.Element;
