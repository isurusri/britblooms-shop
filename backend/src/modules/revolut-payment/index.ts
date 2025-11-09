import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import RevolutPaymentService from "./service"

export default ModuleProvider(Modules.PAYMENT, {
  services: [RevolutPaymentService],
})

