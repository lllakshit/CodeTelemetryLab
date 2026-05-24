"use client"

import { motion } from "framer-motion"

export function HeroPulse() {
  return (
    <motion.div
      aria-hidden="true"
      className="absolute -right-16 top-8 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl"
      animate={{ opacity: [0.45, 0.8, 0.45], scale: [1, 1.05, 1] }}
      transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
    />
  )
}
