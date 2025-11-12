import * as React from "react"

// import { cn } from "@/lib/utils" // Removed cn import

// Helper function to combine class names (replaces cn)
const joinClasses = (...classes) => {
  return classes.filter(Boolean).join(' ').trim()
}

// Removed type annotations
const Table = React.forwardRef(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={joinClasses("w-full caption-bottom text-sm", className)} // Replaced cn()
      {...props}
    />
  </div>
))
Table.displayName = "Table"

// Removed type annotations
const TableHeader = React.forwardRef(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={joinClasses("[&_tr]:border-b", className)} // Replaced cn()
    {...props}
  />
))
TableHeader.displayName = "TableHeader"

// Removed type annotations
const TableBody = React.forwardRef(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={joinClasses("[&_tr:last-child]:border-0", className)} // Replaced cn()
    {...props}
  />
))
TableBody.displayName = "TableBody"

// Removed type annotations
const TableFooter = React.forwardRef(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={joinClasses( // Replaced cn()
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

// Removed type annotations
const TableRow = React.forwardRef(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={joinClasses( // Replaced cn()
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

// Removed type annotations
const TableHead = React.forwardRef(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={joinClasses( // Replaced cn()
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

// Removed type annotations
const TableCell = React.forwardRef(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={joinClasses("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)} // Replaced cn()
    {...props}
  />
))
TableCell

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
}