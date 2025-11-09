"use client"

import { useEffect, useRef, useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@/components/Button"
import ErrorMessage from "@modules/checkout/components/error-message"

type RevolutCheckoutButtonProps = {
  cart: HttpTypes.StoreCart
  onSuccess?: () => void
  disabled?: boolean
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

const RevolutCheckoutButton: React.FC<RevolutCheckoutButtonProps> = ({
  cart,
  onSuccess,
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
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
      setScriptLoaded(true)
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
      setScriptLoaded(true)
    }

    script.onerror = () => {
      setError("Failed to load Revolut Checkout script")
    }

    document.body.appendChild(script)

    return () => {
      // Cleanup script on unmount
      const existingScript = document.getElementById(scriptId)
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [])

  // Initialize Revolut Checkout when token is available
  useEffect(() => {
    if (
      !scriptLoaded ||
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
        setError(errorMessage)
      }
    }

    initializeCheckout()
  }, [scriptLoaded, publicToken])

  const handleClick = async () => {
    if (!publicToken) {
      setError("Payment session not initialized")
      return
    }

    if (!scriptLoaded || !window.RevolutCheckout) {
      setError("Revolut Checkout is still loading. Please try again.")
      return
    }

    // Initialize checkout if not already initialized
    if (!payWithPopupRef.current) {
      try {
        setLoading(true)
        const checkout = await window.RevolutCheckout(publicToken)
        payWithPopupRef.current = checkout.payWithPopup
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to initialize checkout"
        setError(errorMessage)
        setLoading(false)
        return
      }
    }

    if (payWithPopupRef.current) {
      setLoading(true)
      setError(null)
      payWithPopupRef.current({
        email: cart.email || undefined,
        onSuccess: () => {
          setLoading(false)
          onSuccess?.()
        },
        onError: (err) => {
          const errorMessage = err.message || "Payment failed"
          setError(errorMessage)
          setLoading(false)
        },
      })
    } else {
      setError("Checkout not initialized. Please refresh the page.")
      setLoading(false)
    }
  }

  // Only disable if:
  // 1. Explicitly disabled by parent (e.g., cart not ready)
  // 2. No payment session exists at all
  // 3. Currently processing/loading
  // Allow button to be enabled even if script hasn't loaded yet or token is missing
  // (will handle initialization and show appropriate error on click if needed)
  const hasPaymentSession = !!paymentSession
  const isButtonDisabled = disabled || !hasPaymentSession || loading

  return (
    <>
      <Button
        isDisabled={isButtonDisabled}
        onPress={handleClick}
        isLoading={loading}
        className="w-full"
      >
        {loading ? "Processing..." : "Place Order"}
      </Button>
      <ErrorMessage error={error} />
    </>
  )
}

export default RevolutCheckoutButton
