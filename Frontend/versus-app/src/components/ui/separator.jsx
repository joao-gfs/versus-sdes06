import React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

/**
 * Helper function to join classes, replacing cn()
 * @param {...string} classes - The classes to join.
 * @returns {string} The joined class string.
 */
function joinClasses(...classes) {
  return classes.filter(Boolean).join(" ");
}

const Separator = React.forwardRef(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={joinClasses(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };