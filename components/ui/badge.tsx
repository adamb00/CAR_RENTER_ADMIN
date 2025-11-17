"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const badgeVariants = {
  default:
    "inline-flex items-center rounded-full border border-transparent bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary shadow-sm",
  secondary:
    "inline-flex items-center rounded-full border border-transparent bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground",
  outline:
    "inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold text-foreground",
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof badgeVariants
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants[variant], className)} {...props} />
  )
}

export { Badge, badgeVariants }
