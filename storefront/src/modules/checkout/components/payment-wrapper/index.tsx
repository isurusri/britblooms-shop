"use client"

import * as React from "react"
import { withReactQueryProvider } from "@lib/util/react-query"
import { StoreCart } from "@medusajs/types"

type WrapperProps = {
  children: React.ReactNode
  cart: StoreCart // cart is unused, but kept for type consistency
}

// Simple wrapper component for payment providers
const Wrapper: React.FC<WrapperProps> = ({ children }) => {
  return <div>{children}</div>
}

export default withReactQueryProvider(Wrapper)
