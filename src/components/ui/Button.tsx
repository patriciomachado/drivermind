import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "destructive" | "outline" | "ghost"
    size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
                    {
                        "bg-primary-600 text-white hover:bg-primary-700": variant === "default",
                        "bg-red-600 text-white hover:bg-red-700": variant === "destructive",
                        "border border-slate-700 bg-transparent hover:bg-slate-800 text-slate-100": variant === "outline",
                        "hover:bg-slate-800 text-slate-100": variant === "ghost",

                        "h-12 px-4 py-2 text-base": size === "default",
                        "h-9 rounded-lg px-3": size === "sm",
                        "h-14 rounded-xl px-8 text-lg": size === "lg",
                        "h-10 w-10": size === "icon",
                    },
                    className
                )}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
