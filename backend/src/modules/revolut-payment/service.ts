import { AbstractPaymentProvider } from "@medusajs/framework/utils"
import type {
  AuthorizePaymentInput,
  CapturePaymentInput,
  RefundPaymentInput,
  CancelPaymentInput,
  DeletePaymentInput,
  RetrievePaymentInput,
  UpdatePaymentInput,
  InitiatePaymentInput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentOutput,
  UpdatePaymentOutput,
  DeletePaymentOutput,
  AuthorizePaymentOutput,
  CapturePaymentOutput,
  RefundPaymentOutput,
  CancelPaymentOutput,
  RetrievePaymentOutput,
  ProviderWebhookPayload,
  WebhookActionResult,
} from "@medusajs/framework/types"
import { PaymentSessionStatus, BigNumber } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/framework/utils"
import axios, { AxiosInstance } from "axios"

// Define Revolut's Order structure (based on API v2024-09-01)
interface RevolutOrder {
  id: string
  token: string // New API version uses 'token' instead of 'public_key'
  state: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED" | "completed" | "pending" | "failed" | "cancelled" // Support both uppercase and lowercase
  amount: number
  currency: string
  public_id?: string // Deprecated but may still be present for backward compatibility
}

// Define the options for your service
type RevolutServiceOptions = {
  api_key: string
  production_url?: string
  sandbox_url?: string
  api_version?: string // Revolut API version (default: "2023-09-01")
}

class RevolutPaymentService extends AbstractPaymentProvider<RevolutServiceOptions> {
  static identifier = "revolut"

  protected readonly options_: RevolutServiceOptions
  protected revolutApi_: AxiosInstance

  constructor(container: Record<string, unknown>, options: RevolutServiceOptions) {
    super(container, options)
    this.options_ = options

    this.revolutApi_ = axios.create({
      baseURL: this.options_.production_url || this.options_.sandbox_url || "https://merchant.revolut.com",
      headers: {
        Authorization: `Bearer ${this.options_.api_key}`,
        "Content-Type": "application/json",
        "Revolut-Api-Version": this.options_.api_version || "2024-09-01", // Required header for Revolut API
      },
    })
  }

  protected buildError(
    message: string,
    error: any
  ): { error: string; code: string; detail: string } {
    const errorData = error.response?.data
    return {
      error: message,
      code: errorData?.code || "",
      detail: errorData?.message || error.message || "Unknown Revolut error",
    }
  }

  async initiatePayment(
    context: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    const { amount, currency_code, data } = context

    // Check if API key is configured
    if (!this.options_.api_key) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Revolut API key is not configured. Please set REVOLUT_SECRET_KEY environment variable."
      )
    }

    try {
      // Medusa v2 sends amounts in base unit (e.g., 160.00 for £160.00)
      // Revolut expects amounts in smallest currency unit (e.g., 16000 pence for £160.00)
      // Convert BigNumberInput to number
      const amountValue = typeof amount === "number" 
        ? amount 
        : new BigNumber(amount).valueOf()

      // Most currencies have 2 decimal places (GBP, USD, EUR, etc.)
      // Some currencies like JPY don't have decimals
      // For standard currencies, multiply by 100 to convert to smallest unit
      const currencyDecimals: Record<string, number> = {
        JPY: 0, // Japanese Yen has no decimals
        KRW: 0, // Korean Won has no decimals
        CLP: 0, // Chilean Peso has no decimals
        VND: 0, // Vietnamese Dong has no decimals
      }
      
      const decimalPlaces = currencyDecimals[currency_code.toUpperCase()] ?? 2
      const amountInSmallestUnit = decimalPlaces === 0 
        ? Math.round(amountValue)
        : Math.round(amountValue * 100)

      const response = await this.revolutApi_.post("/api/orders", {
        amount: amountInSmallestUnit, // Revolut expects amount in smallest unit
        currency: currency_code.toUpperCase(),
        metadata: {
          ...(data?.cart_id ? { cart_id: data.cart_id } : {}),
        },
      })

      const revolutOrder: RevolutOrder = response.data

      // Return session data - API v2024-09-01 returns 'token' instead of 'public_key'
      // Use token if available, otherwise fallback to public_id for backward compatibility
      const orderToken = revolutOrder.token || revolutOrder.public_id

      if (!orderToken) {
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          "Order created but token is missing from response"
        )
      }

      return {
        id: revolutOrder.id,
        data: {
          id: revolutOrder.id,
          public_key: orderToken, // Keep 'public_key' key for frontend compatibility
          token: orderToken, // Also include 'token' for new API version
        },
      }
    } catch (error: any) {
      // Better error logging for debugging
      const errorMessage = error.response?.data?.message || error.message || "Unknown error"
      const errorCode = error.response?.data?.code || error.response?.status || "UNKNOWN"
      const statusCode = error.response?.status

      console.error("Revolut API Error:", {
        message: errorMessage,
        code: errorCode,
        status: statusCode,
        url: error.config?.url,
        baseURL: this.revolutApi_.defaults.baseURL,
      })

      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to create Revolut order: ${errorMessage} (Code: ${errorCode}${statusCode ? `, Status: ${statusCode}` : ""})`
      )
    }
  }

  async retrievePayment(
    context: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    try {
      const orderId = context.data?.id as string
      if (!orderId) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Order ID is missing from payment session data"
        )
      }
      const response = await this.revolutApi_.get(`/api/orders/${orderId}`)
      return { data: response.data }
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        this.buildError("Failed to retrieve Revolut order", error).detail
      )
    }
  }

  async updatePayment(
    context: UpdatePaymentInput
  ): Promise<UpdatePaymentOutput> {
    const { amount, currency_code, data, context: paymentContext } = context
    const orderId = data?.id as string

    if (!orderId) {
      // If no order ID, create a new payment session
      return this.initiatePayment({
        amount,
        currency_code,
        data,
        context: paymentContext,
      })
    }

    try {
      // Convert from base unit to smallest unit
      const amountValue = typeof amount === "number"
        ? amount
        : new BigNumber(amount).valueOf()
      
      const currencyDecimals: Record<string, number> = {
        JPY: 0,
        KRW: 0,
        CLP: 0,
        VND: 0,
      }
      const decimalPlaces = currencyDecimals[currency_code.toUpperCase()] ?? 2
      const amountInSmallestUnit = decimalPlaces === 0 
        ? Math.round(amountValue)
        : Math.round(amountValue * 100)
        
      await this.revolutApi_.patch(`/api/orders/${orderId}`, {
        amount: amountInSmallestUnit,
      })
      return { id: orderId, data: data || {} } as UpdatePaymentOutput
    } catch (error) {
      // If update fails, create a new payment session
      return this.initiatePayment({
        amount,
        currency_code,
        data,
        context: paymentContext,
      })
    }
  }

  async authorizePayment(
    context: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    const orderId = context.data?.id as string

    if (!orderId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Order ID is missing from payment session data"
      )
    }

    try {
      const response = await this.revolutApi_.get(`/api/orders/${orderId}`)
      const revolutOrder: RevolutOrder = response.data

      let status: PaymentSessionStatus

      // Normalize state to uppercase for consistent comparison
      const normalizedState = revolutOrder.state.toUpperCase()

      switch (normalizedState) {
        case "COMPLETED":
          // Payment is completed on Revolut's side
          // Return AUTHORIZED so Medusa can create the order
          // The capture will happen automatically or via webhook
          status = PaymentSessionStatus.AUTHORIZED
          break
        case "FAILED":
          status = PaymentSessionStatus.ERROR
          break
        case "PENDING":
          // Payment is still pending on Revolut's side
          // Return AUTHORIZED to allow order creation
          // Payment will be verified via webhook when it completes
          status = PaymentSessionStatus.AUTHORIZED
          break
        case "CANCELLED":
          status = PaymentSessionStatus.ERROR
          break
        default:
          // Default to AUTHORIZED to allow order creation
          // Payment verification happens after order creation via webhook
          status = PaymentSessionStatus.AUTHORIZED
          break
      }

      return { status, data: context.data || {} }
    } catch (error) {
      // If we can't retrieve the order (e.g., during initial order creation),
      // return AUTHORIZED to allow order creation
      // Payment will be verified after Revolut payment succeeds
      console.warn(`Could not retrieve Revolut order ${orderId}:`, error)
      
      // Return AUTHORIZED to allow order creation
      // Payment verification will happen after user completes payment
      return { 
        status: PaymentSessionStatus.AUTHORIZED, 
        data: context.data || {} 
      }
    }
  }

  async capturePayment(
    context: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    // Get the Revolut order ID from the payment data
    // The order ID is stored in the payment data when the payment session was created
    // Try multiple possible locations where the order ID might be stored
    const orderId = 
      (context.data?.id as string) ||
      (context.data?.order_id as string)

    if (!orderId) {
      console.error("Revolut capturePayment: Missing order ID", {
        paymentData: context.data,
        contextKeys: Object.keys(context),
        fullContext: JSON.stringify(context, null, 2),
      })
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Revolut order ID is missing from payment data. Cannot capture payment. Please ensure the Revolut order ID (e.g., 6905f0f0-a890-a5d2-a7bb-b39f2f8ea78f) is stored in payment.data.id. Current data: ${JSON.stringify(context.data || {})}`
      )
    }

    try {
      // Verify the payment is actually completed on Revolut's side
      const response = await this.revolutApi_.get(`/api/orders/${orderId}`)
      const revolutOrder: RevolutOrder = response.data

      // Normalize state to uppercase for comparison
      // Revolut API might return state in lowercase or uppercase
      const normalizedState = typeof revolutOrder.state === 'string' 
        ? revolutOrder.state.toUpperCase() 
        : String(revolutOrder.state).toUpperCase()

      // Revolut payments are auto-captured when they reach COMPLETED state
      // If the order is not COMPLETED, throw an error
      if (normalizedState !== "COMPLETED") {
        console.error("Revolut capturePayment: Order not completed", {
          orderId,
          state: revolutOrder.state,
          normalizedState,
          revolutOrder: JSON.stringify(revolutOrder),
        })
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Payment cannot be captured. Revolut order ${orderId} is in "${revolutOrder.state}" state. Payment must be in COMPLETED state to be captured. Current state: ${normalizedState}`
        )
      }

      // Payment is completed on Revolut's side, return success
      console.log(`Revolut capturePayment: Successfully captured payment for order ${orderId}`)
      return { data: context.data || {} }
    } catch (error) {
      if (error instanceof MedusaError) {
        throw error
      }

      // If it's an API error, check if it's a 404 (order not found)
      if (error.response?.status === 404) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Revolut order ${orderId} not found. Cannot verify payment status.`
        )
      }

      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        this.buildError("Failed to capture Revolut payment", error).detail
      )
    }
  }

  async refundPayment(
    context: RefundPaymentInput
  ): Promise<RefundPaymentOutput> {
    const orderId = context.data?.id as string
    if (!orderId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Order ID is missing from payment data"
      )
    }

    try {
      // Convert from base unit to smallest unit for refund
      const amountValue = typeof context.amount === "number"
        ? context.amount
        : new BigNumber(context.amount).valueOf()
      
      // Get currency from payment data or use default
      const paymentCurrency = (context.data as any)?.currency || "GBP"
      const currencyDecimals: Record<string, number> = {
        JPY: 0,
        KRW: 0,
        CLP: 0,
        VND: 0,
      }
      const decimalPlaces = currencyDecimals[paymentCurrency.toUpperCase()] ?? 2
      const amountInSmallestUnit = decimalPlaces === 0 
        ? Math.round(amountValue)
        : Math.round(amountValue * 100)
        
      const response = await this.revolutApi_.post(`/api/orders/${orderId}/refund`, {
        amount: amountInSmallestUnit,
      })
      return { data: response.data }
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        this.buildError("Failed to refund Revolut payment", error).detail
      )
    }
  }

  async cancelPayment(
    context: CancelPaymentInput
  ): Promise<CancelPaymentOutput> {
    const orderId = context.data?.id as string
    if (!orderId) {
      return { data: context.data || {} }
    }

    try {
      const response = await this.revolutApi_.post(`/api/orders/${orderId}/cancel`)
      return { data: response.data }
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        this.buildError("Failed to cancel Revolut order", error).detail
      )
    }
  }

  async deletePayment(
    context: DeletePaymentInput
  ): Promise<DeletePaymentOutput> {
    // When a payment session needs to be deleted (e.g., when switching payment methods
    // or removing cart items), we cancel the Revolut order
    const orderId = context.data?.id as string
    
    if (!orderId) {
      // If no order ID, just return empty data (session may not exist yet)
      return { data: context.data || {} }
    }

    try {
      // Cancel the Revolut order to clean up the payment session
      await this.revolutApi_.post(`/api/orders/${orderId}/cancel`)
      return { data: context.data || {} }
    } catch (error) {
      // If cancellation fails (e.g., order already cancelled), don't throw an error
      // Just return the data to allow Medusa to delete the session
      // Log the error but don't fail the deletion
      return { data: context.data || {} }
    }
  }

  async getPaymentStatus(
    context: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const orderId = context.data?.id as string
    try {
      const response = await this.revolutApi_.get(`/api/orders/${orderId}`)
      const revolutOrder: RevolutOrder = response.data

      let status: PaymentSessionStatus
      // Normalize state to uppercase for consistent comparison
      const normalizedState = revolutOrder.state.toUpperCase()
      
      switch (normalizedState) {
        case "COMPLETED":
          status = PaymentSessionStatus.AUTHORIZED
          break
        case "FAILED":
          status = PaymentSessionStatus.ERROR
          break
        default:
          status = PaymentSessionStatus.PENDING
          break
      }

      return { status, data: context.data || {} }
    } catch (error) {
      return { status: PaymentSessionStatus.ERROR, data: context.data || {} }
    }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const { data, rawData, headers } = payload

    try {
      // Parse Revolut webhook data
      // According to Revolut docs: https://developer.revolut.com/docs/merchant/webhooks
      // Webhook payload structure:
      // {
      //   "event": "ORDER_COMPLETED" | "ORDER_AUTHORISED",
      //   "order_id": "string",
      //   "merchant_order_ext_ref": "string" (optional),
      //   "timestamp": "string" (optional)
      // }
      const webhookData = data as Record<string, unknown>
      
      // Revolut sends "event" field, not "event_type" or "type"
      const eventType = (webhookData.event as string) || 
                       (webhookData.event_type as string) || 
                       (webhookData.type as string)
      
      // Revolut sends "order_id" field
      const orderId = (webhookData.order_id as string) || 
                      (webhookData.id as string)

      if (!orderId) {
        console.error("Revolut webhook: Missing order_id", webhookData)
        return {
          action: "not_supported",
          data: {
            session_id: "",
            amount: new BigNumber(0),
          },
        }
      }

      // Only process ORDER_COMPLETED and ORDER_AUTHORISED events
      if (
        eventType !== "ORDER_COMPLETED" &&
        eventType !== "ORDER_AUTHORISED"
      ) {
        console.log(
          `Revolut webhook: Ignoring unsupported event type: ${eventType}`
        )
        return {
          action: "not_supported",
          data: {
            session_id: orderId,
            amount: new BigNumber(0),
          },
        }
      }

      // Get order details from Revolut to determine action
      try {
        const response = await this.revolutApi_.get(`/api/orders/${orderId}`)
        const revolutOrder: RevolutOrder = response.data

        // Normalize state to uppercase for consistent comparison
        const normalizedState = revolutOrder.state.toUpperCase()
        
        switch (normalizedState) {
          case "COMPLETED":
            // Payment completed on Revolut - return "authorized" action
            // Medusa will then call capturePayment which will verify the payment is COMPLETED
            // For ORDER_COMPLETED events, we should trigger capture
            if (eventType === "ORDER_COMPLETED") {
              return {
                action: "authorized",
                data: {
                  session_id: orderId,
                  amount: new BigNumber(revolutOrder.amount),
                },
              }
            }
            // For ORDER_AUTHORISED, also return authorized
            return {
              action: "authorized",
              data: {
                session_id: orderId,
                amount: new BigNumber(revolutOrder.amount),
              },
            }
          case "FAILED":
            return {
              action: "failed",
              data: {
                session_id: orderId,
                amount: new BigNumber(revolutOrder.amount),
              },
            }
          default:
            return {
              action: "not_supported",
              data: {
                session_id: orderId,
                amount: new BigNumber(revolutOrder.amount),
              },
            }
        }
      } catch (error) {
        console.error(
          `Revolut webhook: Failed to fetch order ${orderId}:`,
          error
        )
        return {
          action: "not_supported",
          data: {
            session_id: orderId,
            amount: new BigNumber(0),
          },
        }
      }
    } catch (error) {
      console.error("Revolut webhook: Error processing webhook:", error)
      return {
        action: "failed",
        data: {
          session_id: "",
          amount: new BigNumber(0),
        },
      }
    }
  }
}

export default RevolutPaymentService

