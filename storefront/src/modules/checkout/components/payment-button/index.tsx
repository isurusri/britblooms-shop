"use client"

import React, { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { useRouter } from "next/navigation"

import { isManual, isRevolut } from "@lib/constants"
import { Button } from "@/components/Button"
import { Icon } from "@/components/Icon"
import ErrorMessage from "@modules/checkout/components/error-message"
import { usePlaceOrder } from "hooks/cart"
import { withReactQueryProvider } from "@lib/util/react-query"
import RevolutCheckoutButton from "@modules/checkout/components/revolut-checkout/button"

type PaymentButtonProps = {
  cart: HttpTypes.StoreCart
  selectPaymentMethod: () => void
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  selectPaymentMethod,
}) => {
  const notReady =
    !cart ||
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email ||
    (cart.shipping_methods?.length ?? 0) < 1

  // TODO: Add this once gift cards are implemented
  // const paidByGiftcard =
  //   cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  // if (paidByGiftcard) {
  //   return <GiftCardPaymentButton />
  // }

  const paymentSession = cart.payment_collection?.payment_sessions?.[0]

  switch (true) {
    case isRevolut(paymentSession?.provider_id):
      return <RevolutPaymentButton notReady={notReady} cart={cart} />
    case isManual(paymentSession?.provider_id):
      return <ManualTestPaymentButton notReady={notReady} />
    default:
      return (
        <Button
          className="w-full"
          onPress={() => {
            selectPaymentMethod()
          }}
        >
          Select a payment method
        </Button>
      )
  }
}

// const GiftCardPaymentButton = () => {
//   const [submitting, setSubmitting] = useState(false)

//   const handleOrder = async () => {
//     setSubmitting(true)
//     await placeOrder()
//   }

//   return (
//     <Button onPress={handleOrder} isLoading={submitting} className="w-full">
//       Place order
//     </Button>
//   )
// }

const RevolutPaymentButton = ({
  cart,
  notReady,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isProcessingOrder, setIsProcessingOrder] = useState(false)
  const placeOrder = usePlaceOrder()
  const router = useRouter()

  const onPaymentCompleted = async () => {
    // Show loading overlay immediately after payment completes
    setIsProcessingOrder(true)
    setErrorMessage(null)

    // After successful payment via Revolut checkout,
    // wait a brief moment to ensure payment is fully processed
    // then place the order
    // This ensures the payment status is COMPLETED on Revolut's side
    await new Promise((resolve) => setTimeout(resolve, 1000))

    placeOrder.mutate(null, {
      onSuccess: (data) => {
        if (data?.type === "order") {
          const countryCode =
            data.order.shipping_address?.country_code?.toLowerCase()
          router.push(`/${countryCode}/order/confirmed/${data.order.id}`)
          // Keep loading state until navigation completes
          // The order confirmation page loading.tsx will handle the transition
        } else if (data?.error) {
          setErrorMessage(data.error.message)
          setIsProcessingOrder(false)
        }
      },
      onError: (error) => {
        setErrorMessage(error.message)
        setIsProcessingOrder(false)
      },
    })
  }

  return (
    <>
      <RevolutCheckoutButton
        cart={cart}
        onSuccess={onPaymentCompleted}
        disabled={notReady}
      />
      {errorMessage && <ErrorMessage error={errorMessage} />}
      {isProcessingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Icon name="loader" className="w-12 h-12 animate-spin text-black" />
            <p className="text-lg font-medium text-grayscale-900">
              Processing your order...
            </p>
            <p className="text-sm text-grayscale-600">
              Please wait while we finalize your purchase
            </p>
          </div>
        </div>
      )}
    </>
  )
}

const ManualTestPaymentButton = ({ notReady }: { notReady: boolean }) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const placeOrder = usePlaceOrder()

  const router = useRouter()

  const onPaymentCompleted = () => {
    placeOrder.mutate(null, {
      onSuccess: (data) => {
        if (data?.type === "order") {
          const countryCode =
            data.order.shipping_address?.country_code?.toLowerCase()
          router.push(`/${countryCode}/order/confirmed/${data.order.id}`)
        } else if (data?.error) {
          setErrorMessage(data.error.message)
        }
      },
      onError: (error) => {
        setErrorMessage(error.message)
      },
    })
  }

  const handlePayment = () => {
    onPaymentCompleted()
  }

  return (
    <>
      <Button
        isDisabled={notReady}
        isLoading={placeOrder.isPending}
        onPress={handlePayment}
        className="w-full"
      >
        Place order
      </Button>
      <ErrorMessage error={errorMessage} />
    </>
  )
}

export default withReactQueryProvider(PaymentButton)
