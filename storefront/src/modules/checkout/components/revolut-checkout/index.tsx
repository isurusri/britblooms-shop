"use client"

import { useEffect, useRef, useState } from "react"
import { HttpTypes } from "@medusajs/types"

type RevolutCheckoutProps = {
  cart: HttpTypes.StoreCart
  onSuccess?: () => void
  onError?: (error: string) => void
}

declare global {
  interface Window {
    RevolutCheckout?: (publicToken: string) => Promise<{
      payWithPopup: (options?: {
        email?: string
        onSuccess?: () => void
        onError?: (error: Error) => void
      }) => void
    }>
  }
}

const RevolutCheckout: React.FC<RevolutCheckoutProps> = ({
  cart,
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(true)
  const payWithPopupRef = useRef<
    | ((options?: {
        email?: string
        onSuccess?: () => void
        onError?: (error: Error) => void
      }) => void)
    | null
  >(null)

  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  const publicToken =
    (paymentSession?.data?.public_key as string) ||
    (paymentSession?.data?.token as string)

  // Load Revolut Checkout script
  useEffect(() => {
    const scriptId = "revolut-checkout-script"

    // Check if script already exists
    if (document.getElementById(scriptId)) {
      setLoading(false)
      return
    }

    // Determine if we're in production or sandbox
    const isProduction =
      process.env.NEXT_PUBLIC_REVOLUT_USE_PRODUCTION === "true"
    const scriptSrc = isProduction
      ? "https://merchant.revolut.com/embed.js"
      : "https://sandbox-merchant.revolut.com/embed.js"

    const script = document.createElement("script")
    script.id = scriptId
    script.src = scriptSrc
    script.async = true

    script.onload = () => {
      setLoading(false)
    }

    script.onerror = () => {
      setLoading(false)
      onError?.("Failed to load Revolut Checkout script")
    }

    document.body.appendChild(script)

    return () => {
      // Cleanup script on unmount
      const existingScript = document.getElementById(scriptId)
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [onError])

  // Initialize Revolut Checkout when token is available
  useEffect(() => {
    if (
      loading ||
      !publicToken ||
      !window.RevolutCheckout ||
      payWithPopupRef.current
    ) {
      return
    }

    const initializeCheckout = async () => {
      try {
        if (!window.RevolutCheckout) {
          return
        }

        const checkout = await window.RevolutCheckout(publicToken)
        payWithPopupRef.current = checkout.payWithPopup
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to initialize checkout"
        onError?.(errorMessage)
      }
    }

    initializeCheckout()
  }, [loading, publicToken, onError])

  // Expose methods via ref or return null if used as a wrapper
  return null
}

export default RevolutCheckout
export { RevolutCheckout }
