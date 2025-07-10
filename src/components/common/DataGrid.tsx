import { ReactNode } from "react";

interface DataGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function DataGrid({ children, columns = 3, className = "" }: DataGridProps) {
  const getGridClass = (cols: number) => {
    switch (cols) {
      case 1: return "grid-cols-1";
      case 2: return "md:grid-cols-2";
      case 3: return "md:grid-cols-2 lg:grid-cols-3";
      case 4: return "md:grid-cols-2 lg:grid-cols-4";
      default: return "md:grid-cols-2 lg:grid-cols-3";
    }
  };

  return (
    <div className={`grid gap-4 ${getGridClass(columns)} ${className}`}>
      {children}
    </div>
  );
}