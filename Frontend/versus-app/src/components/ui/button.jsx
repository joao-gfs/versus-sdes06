import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-versus-yellow text-background hover:bg-versus-yellow/90", // Amarelo com texto escuro
        destructive:
          "bg-versus-red text-white hover:bg-versus-red/90", // Vermelho com texto branco
        outline:
          "border border-versus-grey text-versus-grey bg-transparent hover:bg-versus-grey hover:text-background", // Contorno cinza
        secondary:
          "bg-versus-grey text-background hover:bg-versus-grey/80", // Cinza com texto escuro
        ghost:
          "hover:bg-versus-grey/20 hover:text-versus-grey", // Fundo escuro, então hover claro
        link:
          "text-versus-blue underline-offset-4 hover:underline", // Azul para links
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={buttonVariants({ variant, size, className })} // Correto, sem cn() como você fez
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }