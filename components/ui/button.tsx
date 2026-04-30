import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    const variants = {
      default: "bg-blue-600 text-white hover:bg-blue-700",
      outline: "border border-gray-300 bg-white hover:bg-gray-100",
      ghost: "hover:bg-gray-100",
      secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200"
    }
    
    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-8 px-3 text-sm",
      lg: "h-12 px-8",
      icon: "h-10 w-10"
    }
    
    return (
      <button
        className={"inline-flex items-center justify-center rounded-lg font-medium transition-colors " + variants[variant] + " " + sizes[size] + " " + className}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
