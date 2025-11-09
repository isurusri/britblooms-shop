import { Modules } from "@medusajs/framework/utils";
import {
  INotificationModuleService,
  IOrderModuleService,
} from "@medusajs/framework/types";
import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa";
import { EmailTemplates } from "../modules/email-notifications/templates";

// Admin email configuration
const ADMIN_EMAIL = "support@britblooms.com"; // Replace with your admin email

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  const notificationModuleService: INotificationModuleService =
    container.resolve(Modules.NOTIFICATION);
  const orderModuleService: IOrderModuleService = container.resolve(
    Modules.ORDER
  );

  const order = await orderModuleService.retrieveOrder(data.id, {
    relations: ["items", "summary", "shipping_address"],
  });
  const shippingAddress = await (
    orderModuleService as any
  ).orderAddressService_.retrieve(order.shipping_address.id);

  try {
    // Send customer notification
    await notificationModuleService.createNotifications({
      to: order.email,
      channel: "email",
      template: EmailTemplates.ORDER_PLACED,
      data: {
        emailOptions: {
          replyTo: "info@britblooms.com",
          subject: "Your order has been placed",
        },
        order,
        shippingAddress,
        preview: "Thank you for your order!",
      },
    });

    // Send admin notification
    await notificationModuleService.createNotifications({
      to: ADMIN_EMAIL,
      channel: "email",
      template: EmailTemplates.ORDER_NOTIFICATION,
      data: {
        emailOptions: {
          replyTo: order.email,
          subject: `New Order #${order.display_id} Received`,
        },
        order,
        customerDetails: {
          email: order.email,
          phone: shippingAddress.phone,
        },
        shippingAddress,
        preview: "New Order Received!",
      },
    });
  } catch (error) {
    console.error("Error sending order notifications:", error);
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
