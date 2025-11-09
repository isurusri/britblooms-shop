import { ReactNode } from 'react'
import { MedusaError } from '@medusajs/framework/utils'
import { InviteUserEmail, INVITE_USER, isInviteUserData } from './invite-user'
import { OrderPlacedTemplate, ORDER_PLACED, isOrderPlacedTemplateData } from './order-placed'
import { OrderNotificationTemplate, ORDER_NOTIFICATION, OrderNotificationTemplateProps } from './order-notification'
import { CustomerWelcomeTemplate, CUSTOMER_WELCOME, CustomerWelcomeTemplateProps } from './customer-welcome'
import { AuthPasswordForgotResetTemplate, AUTH_PASSWORD_FORGOT_RESET, AuthPasswordForgotResetTemplateProps} from "./auth-forgot-password";
import { AuthPasswordResetTemplate, AUTH_PASSWORD_RESET, AuthPasswordResetTemplateProps } from './auth-password-reset'


export const EmailTemplates = {
  INVITE_USER,
  ORDER_PLACED,
  ORDER_NOTIFICATION,
  CUSTOMER_WELCOME,
  AUTH_PASSWORD_FORGOT_RESET,
  AUTH_PASSWORD_RESET,
} as const;

export type EmailTemplateType = keyof typeof EmailTemplates

// Add type guard for OrderNotificationTemplateProps
export const isOrderNotificationTemplateData = (data: any): data is OrderNotificationTemplateProps => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'order' in data &&
    'customerDetails' in data &&
    'shippingAddress' in data
  )
}

// Add type guard for CustomerWelcomeTemplateProps
export const isCustomerWelcomeTemplateData = (data: any): data is CustomerWelcomeTemplateProps => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'customer' in data &&
    typeof data.customer === 'object' &&
    data.customer !== null &&
    'first_name' in data.customer &&
    'last_name' in data.customer &&
    'email' in data.customer
  )
}

// Add type guard
export const isAuthPasswordResetTemplateData = (data: any): data is AuthPasswordResetTemplateProps => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'customer' in data &&
    'token' in data &&
    typeof data.customer === 'object' &&
    data.customer !== null &&
    'email' in data.customer
  )
}

export function generateEmailTemplate(templateKey: string, data: unknown): ReactNode {
  switch (templateKey) {
    case EmailTemplates.INVITE_USER:
      if (!isInviteUserData(data)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Invalid data for template "${EmailTemplates.INVITE_USER}"`
        );
      }
      return <InviteUserEmail {...data} />;

    case EmailTemplates.ORDER_PLACED:
      if (!isOrderPlacedTemplateData(data)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Invalid data for template "${EmailTemplates.ORDER_PLACED}"`
        );
      }
      return <OrderPlacedTemplate {...data} />;

    case EmailTemplates.ORDER_NOTIFICATION:
      if (!isOrderNotificationTemplateData(data)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Invalid data for template "${EmailTemplates.ORDER_NOTIFICATION}"`
        );
      }
      return <OrderNotificationTemplate {...data} />;

    case EmailTemplates.CUSTOMER_WELCOME:
      if (!isCustomerWelcomeTemplateData(data)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Invalid data for template "${EmailTemplates.CUSTOMER_WELCOME}"`
        );
      }
      return <CustomerWelcomeTemplate {...data} />;

    case EmailTemplates.AUTH_PASSWORD_FORGOT_RESET:
      if (!isAuthPasswordResetTemplateData(data)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Invalid data for template "${EmailTemplates.AUTH_PASSWORD_FORGOT_RESET}"`
        );
      }
      return <AuthPasswordForgotResetTemplate {...data} />;

    case EmailTemplates.AUTH_PASSWORD_RESET:
      if (!isAuthPasswordResetTemplateData(data)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Invalid data for template "${EmailTemplates.AUTH_PASSWORD_RESET}"`
        );
      }
      return <AuthPasswordResetTemplate {...data} />;

    default:
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Unknown template key: "${templateKey}"`
      );
  }
}

export { InviteUserEmail, OrderPlacedTemplate }
