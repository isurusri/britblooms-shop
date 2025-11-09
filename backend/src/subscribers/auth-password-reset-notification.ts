import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { 
  CustomerDTO,
  INotificationModuleService, 
  IUserModuleService 
} from "@medusajs/framework/types";
import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa";
import { EmailTemplates } from "../modules/email-notifications/templates";

export default async function sendPasswordResetNotification({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  const notificationService: INotificationModuleService = container.resolve(
    Modules.NOTIFICATION
  );
  const userService: IUserModuleService = container.resolve(Modules.USER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

   const fields = [
     "id",
     "email",
     "first_name",
     "last_name",
   ] as const satisfies (keyof CustomerDTO)[];

   const { data: customers } = await query.graph({
     entity: "customer",
     fields,
     filters: { email: data.entity_id },
   });
   const customer = customers[0] as Pick<CustomerDTO, (typeof fields)[number]>;


  try {
    // Extract email from the token payload
    const email = data.entity_id // This contains the email address

    // Get user details if available
    let userDetails = {
      email: email,
      first_name: undefined,
      last_name: undefined
    }

    try {
      if (customer) {
        userDetails = {
          email: email,
          first_name: customer.first_name,
          last_name: customer.last_name,
        };
      }
    } catch (err) {
      // User might not exist yet, continue with just email
      console.log("User not found, continuing with email only")
    }

    await notificationService.createNotifications({
      to: customer.email, // Use the email from token payload
      channel: "email",
      template:
        data.actor_type === "logged-in-customer"
          ? EmailTemplates.AUTH_PASSWORD_RESET
          : EmailTemplates.AUTH_PASSWORD_FORGOT_RESET,
      data: {
        emailOptions: {
          subject: "Reset Your Password",
          replyTo: "support@britblooms.com",
        },
        customer: userDetails,
        token: data.token,
        preview: "Reset Your Password",
      },
    });
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error; // Re-throw to ensure error is properly handled
  }
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
};
