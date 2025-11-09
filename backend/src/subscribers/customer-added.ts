import {
  INotificationModuleService
} from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { EmailTemplates } from "../modules/email-notifications/templates";
import type { CustomerDTO } from "@medusajs/framework/types";

export default async function customerAddedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const notificationModuleService: INotificationModuleService =
    container.resolve(Modules.NOTIFICATION);

  const fields = [
    "id",
    "email",
    "first_name",
    "last_name",
  ] as const satisfies (keyof CustomerDTO)[];

  const { data: customers } = await query.graph({
    entity: "customer",
    fields,
    filters: { id: data.id },
  });

  const customer = customers[0] as Pick<CustomerDTO, (typeof fields)[number]>;

  try {
    await notificationModuleService.createNotifications({
      to: customer.email,
      channel: "email",
      template: EmailTemplates.CUSTOMER_WELCOME,
      data: {
        emailOptions: {
          replyTo: "info@britblooms.com",
          subject: "Welcome to Britblooms!",
        },
        customer,
        preview: "We're thrilled to have you with us!",
      },
    });
  } catch (error) {
    console.error(error);
  }
}

export const config: SubscriberConfig = {
  event: "customer.created",
};
