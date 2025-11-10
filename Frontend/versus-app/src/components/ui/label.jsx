import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva } from "class-variance-authority"

// import { cn } from "@/lib/utils" // Removed cn import

// Helper function to combine class names (replaces cn)
const joinClasses = (...classes) => {
  return classes.filter(Boolean).join(' ').trim()
}

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef(
  ({ className, ...props }, ref) => (
    <LabelPrimitive.Root
      ref={ref}
      className={joinClasses(labelVariants(), className)} // Replaced cn()
      {...props}
    />
  )
)
Label.displayName = LabelPrimitive.Root.displayName

export { Label }