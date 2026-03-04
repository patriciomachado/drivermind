import * as React from "react"
import { cn } from "@/lib/utils"

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    selected?: boolean
    label: string
}

const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
    ({ className, selected, label, ...props }, ref) => {
        return (
            <button
                ref={ref}
                type="button"
                className={cn(
                    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 active:scale-95 border",
                    {
                        "bg-primary-600 border-primary-600 text-white": selected,
                        "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700": !selected
                    },
                    className
                )}
                {...props}
            >
                {label}
            </button>
        )
    }
)
Chip.displayName = "Chip"

export { Chip }
