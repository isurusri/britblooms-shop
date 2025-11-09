"use client"

import { useCallback, useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { CreditCard } from "@medusajs/icons"
import { twJoin } from "tailwind-merge"

import { paymentInfoMap } from "@lib/constants"
import PaymentContainer from "@modules/checkout/components/payment-container"
import ErrorMessage from "@modules/checkout/components/error-message"
import PaymentCardButton from "@modules/checkout/components/payment-card-button"

import { Button } from "@/components/Button"
import { UiRadioGroup } from "@/components/ui/Radio"
import { useCartPaymentMethods } from "hooks/cart"
import { StoreCart, StorePaymentSession } from "@medusajs/types"

const Payment = ({ cart }: { cart: StoreCart }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "payment"

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    })
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  const activeSession = cart?.payment_collection?.payment_sessions?.find(
    (paymentSession: StorePaymentSession) => paymentSession.status === "pending"
  )
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? ""
  )
  const { data: availablePaymentMethods } = useCartPaymentMethods(
    cart?.region?.id ?? ""
  )

  const paymentReady =
    activeSession &&
    cart?.shipping_methods &&
    cart?.shipping_methods.length !== 0

  if (!cart) {
    return null
  }
  return (
    <>
      <div className="flex justify-between mb-6 md:mb-8 border-t border-grayscale-200 pt-8 mt-8">
        <div>
          <p
            className={twJoin(
              "transition-fontWeight duration-75",
              isOpen && "font-semibold"
            )}
          >
            4. Payment
          </p>
        </div>
        {!isOpen && paymentReady && (
          <Button variant="link" onPress={handleEdit}>
            Change
          </Button>
        )}
      </div>
      <div className={isOpen ? "block" : "hidden"}>
        {availablePaymentMethods?.length && (
          <>
            <UiRadioGroup
              value={selectedPaymentMethod}
              onChange={setSelectedPaymentMethod}
              aria-label="Payment methods"
            >
              {availablePaymentMethods
                .sort((a, b) => {
                  return a.id > b.id ? 1 : -1
                })

                .map((paymentMethod) => {
                  return (
                    <PaymentContainer
                      paymentInfoMap={paymentInfoMap}
                      paymentProviderId={paymentMethod.id}
                      key={paymentMethod.id}
                    />
                  )
                })}
            </UiRadioGroup>
          </>
        )}

        {/* {paidByGiftcard && (
          <div className="flex gap-10">
            <div className="text-grayscale-500">Payment method</div>
            <div>Gift card</div>
          </div>
        )} */}
        <ErrorMessage
          error={error}
          data-testid="payment-method-error-message"
        />
        <PaymentCardButton
          setError={setError}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          selectedPaymentMethod={selectedPaymentMethod}
          createQueryString={createQueryString}
          cart={cart}
        />
      </div>

      <div className={isOpen ? "hidden" : "block"}>
        {cart && paymentReady && activeSession ? (
          <div className="flex flex-col gap-4">
            <div className="flex max-sm:flex-col flex-wrap gap-y-2 gap-x-12">
              <div className="text-grayscale-500">Payment method</div>
              <div className="text-grayscale-600">Card Payment</div>
            </div>
            <div className="flex max-sm:flex-col flex-wrap gap-y-2 gap-x-14.5">
              <div className="text-grayscale-500">Payment service provider</div>
              <div className="text-grayscale-600 flex items-center gap-2">
                {paymentInfoMap[selectedPaymentMethod]?.icon || <CreditCard />}
                <p>
                  {paymentInfoMap[selectedPaymentMethod]?.title ||
                    selectedPaymentMethod}
                </p>
              </div>
            </div>
          </div> /* : paidByGiftcard ? (
          <div className="flex gap-10">
            <div className="text-grayscale-500">Payment method</div>
            <div>Gift card</div>
          </div>
        ) */
        ) : null}
      </div>
    </>
  )
}

export default Payment
