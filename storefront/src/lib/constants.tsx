import React from "react"
import { CreditCard } from "@medusajs/icons"

/* Map of payment provider_id to their title and icon. Add in any payment providers you want to use. */
export const paymentInfoMap: Record<
  string,
  { title: string; icon: React.JSX.Element }
> = {
  pp_revolut_revolut: {
    title: "Revolut",
    icon: <CreditCard />,
  },
  pp_system_default: {
    title: "Manual Payment",
    icon: <CreditCard />,
  },
}

export const isManual = (providerId?: string) => {
  return providerId?.startsWith("pp_system_default")
}

export const isRevolut = (providerId?: string) => {
  return providerId?.includes("revolut") ?? false
}
