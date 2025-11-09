// External packages
import { Text, Heading, Button } from "@react-email/components";

// Types
import { CustomerDTO } from "@medusajs/framework/types";

// Components
import { Base } from "./base";

type Props = {
  customer: Pick<CustomerDTO, "id" | "email" | "first_name" | "last_name">;
  token: string;
};

export default function AuthEmailConfirmEmail({
  customer,
  token,
  ...emailLayoutProps
}: Props) {
  return (
    <Base {...emailLayoutProps}>
      <Heading className="text-2xl mt-0 mb-10 font-medium">
        Confirm your email address
      </Heading>
      <Text className="text-md !mb-10">
        Thank you for creating an account with Britblooms! Please confirm your
        email address by clicking the button below:
      </Text>
      <Button
        href={`${
          process.env.STOREFRONT_URL || "http://localhost:8000"
        }/auth/confirm-email?email=${encodeURIComponent(
          customer.email
        )}&token=${encodeURIComponent(token)}`}
        className="inline-flex items-center focus-visible:outline-none rounded-xs justify-center transition-colors bg-black hover:bg-grayscale-500 text-white h-10 px-6 mb-10"
      >
        Confirm Email
      </Button>
      <Text className="text-md text-grayscale-500 m-0">
        If you didn&apos;t create an account with us, please ignore this email.
      </Text>
    </Base>
  );
}

AuthEmailConfirmEmail.PreviewProps = {
  customer: {
    id: "1",
    email: "example@medusa.local",
    first_name: "John",
    last_name: "Doe",
  },
  token: "1234567789012345677890",
} satisfies Props;
