"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type MotionDivProps = HTMLMotionProps<"div"> & {
  className?: string;
};

/**
 * Lightweight client-side wrapper around framer-motion's `motion.div`,
 * so that server components can use subtle scroll-in animations
 * without importing `motion` directly (which is client-only).
 */
export const MotionDiv = forwardRef<HTMLDivElement, MotionDivProps>(
  function MotionDiv({ className, children, ...props }, ref) {
    return (
      <motion.div ref={ref} className={cn(className)} {...props}>
        {children}
      </motion.div>
    );
  }
);
