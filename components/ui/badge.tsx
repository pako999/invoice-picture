import * as React from "react"

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outline" | "secondary"
}

export function Badge({ className, children, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "border-transparent",
    outline: "border",
    secondary: "border-transparent bg-gray-100 text-gray-900",
  }
  return (
    <div
      className={
        "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors " +
        variants[variant] +
        " " +
        (className || "")
      }
      {...props}
    >
      {children}
    </div>
  )
}
