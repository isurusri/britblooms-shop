import { Text, Section, Hr } from '@react-email/components'
import * as React from 'react'
import { Base } from './base'
import { OrderDTO, OrderAddressDTO } from '@medusajs/framework/types'

export const ORDER_NOTIFICATION = 'order-notification'

interface OrderNotificationPreviewProps {
  order: OrderDTO & { 
    display_id: string
    summary: { raw_current_order_total: { value: number } }
  }
  customerDetails: {
    email: string
    phone?: string
  }
  shippingAddress: OrderAddressDTO
}

export interface OrderNotificationTemplateProps {
  order: OrderDTO & {
    display_id: string
    summary: { raw_current_order_total: { value: number } }
  }
  customerDetails: {
    email: string
    phone?: string
  }
  shippingAddress: OrderAddressDTO
  preview?: string
}

export const OrderNotificationTemplate: React.FC<OrderNotificationTemplateProps> & {
  PreviewProps: OrderNotificationPreviewProps
} = ({ order, customerDetails, shippingAddress, preview = 'New Order Received!' }) => {
  return (
    <Base preview={preview}>
      <Section>
        <Text style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', margin: '0 0 30px' }}>
          New Order Alert
        </Text>

        <Text style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px' }}>
          Order Details
        </Text>
        <Text style={{ margin: '0 0 5px' }}>
          Order ID: {order.display_id}
        </Text>
        <Text style={{ margin: '0 0 5px' }}>
          Order Date: {new Date(order.created_at).toLocaleDateString()}
        </Text>
        <Text style={{ margin: '0 0 20px' }}>
          Total Amount: {order.summary.raw_current_order_total.value} {order.currency_code}
        </Text>

        <Hr style={{ margin: '20px 0' }} />

        <Text style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px' }}>
          Customer Information
        </Text>
        <Text style={{ margin: '0 0 5px' }}>
          Name: {shippingAddress.first_name} {shippingAddress.last_name}
        </Text>
        <Text style={{ margin: '0 0 5px' }}>
          Email: {customerDetails.email}
        </Text>
        {customerDetails.phone && (
          <Text style={{ margin: '0 0 5px' }}>
            Phone: {customerDetails.phone}
          </Text>
        )}

        <Hr style={{ margin: '20px 0' }} />

        <Text style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px' }}>
          Shipping Address
        </Text>
        <Text style={{ margin: '0 0 5px' }}>
          {shippingAddress.address_1}
          {shippingAddress.address_2 && `, ${shippingAddress.address_2}`}
        </Text>
        <Text style={{ margin: '0 0 5px' }}>
          {shippingAddress.city}, {shippingAddress.province} {shippingAddress.postal_code}
        </Text>
        <Text style={{ margin: '0 0 20px' }}>
          {shippingAddress.country_code}
        </Text>

        <Hr style={{ margin: '20px 0' }} />

        <Text style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 15px' }}>
          Order Items
        </Text>

        <div style={{
          width: '100%',
          borderCollapse: 'collapse',
          border: '1px solid #ddd',
          margin: '10px 0'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            backgroundColor: '#f2f2f2',
            padding: '8px',
            borderBottom: '1px solid #ddd'
          }}>
            <Text style={{ fontWeight: 'bold', width: '40%' }}>Item</Text>
            <Text style={{ fontWeight: 'bold', width: '20%' }}>Quantity</Text>
            <Text style={{ fontWeight: 'bold', width: '20%' }}>Unit Price</Text>
            <Text style={{ fontWeight: 'bold', width: '20%' }}>Total</Text>
          </div>
          {order.items.map((item) => (
            <div key={item.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px',
              borderBottom: '1px solid #ddd'
            }}>
              <Text style={{ width: '40%' }}>{item.title}</Text>
              <Text style={{ width: '20%' }}>{item.quantity}</Text>
              <Text style={{ width: '20%' }}>{item.unit_price} {order.currency_code}</Text>
              <Text style={{ width: '20%' }}>{item.unit_price * item.quantity} {order.currency_code}</Text>
            </div>
          ))}
        </div>
      </Section>
    </Base>
  )
}

OrderNotificationTemplate.PreviewProps = {
  order: {
    id: 'test-order-id',
    display_id: 'ORD-123',
    created_at: new Date().toISOString(),
    currency_code: 'GBP',
    items: [
      { id: 'item-1', title: 'Rose Bouquet', quantity: 2, unit_price: 45 },
      { id: 'item-2', title: 'Lily Arrangement', quantity: 1, unit_price: 35 }
    ],
    summary: { raw_current_order_total: { value: 125 } }
  },
  customerDetails: {
    email: 'customer@example.com',
    phone: '+44123456789'
  },
  shippingAddress: {
    first_name: 'John',
    last_name: 'Doe',
    address_1: '123 High Street',
    city: 'London',
    province: 'Greater London',
    postal_code: 'SW1A 1AA',
    country_code: 'GB'
  }
} as OrderNotificationPreviewProps

export default OrderNotificationTemplate