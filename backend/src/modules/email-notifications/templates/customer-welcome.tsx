import { Text, Section, Hr, Button } from '@react-email/components'
import * as React from 'react'
import { Base } from './base'

export const CUSTOMER_WELCOME = 'customer-welcome'

interface CustomerWelcomePreviewProps {
  customer: {
    first_name: string
    last_name: string
    email: string
  }
}

export interface CustomerWelcomeTemplateProps {
  customer: {
    first_name: string
    last_name: string
    email: string
  }
  preview?: string
}

export const CustomerWelcomeTemplate: React.FC<CustomerWelcomeTemplateProps> & {
  PreviewProps: CustomerWelcomePreviewProps
} = ({ customer, preview = 'Welcome to BritBlooms!' }) => {
  return (
    <Base preview={preview}>
      <Section>
        <Text style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', margin: '0 0 30px' }}>
          Welcome to BritBlooms!
        </Text>

        <Text style={{ margin: '0 0 15px' }}>
          Dear {customer.first_name} {customer.last_name},
        </Text>

        <Text style={{ margin: '0 0 20px' }}>
          Thank you for joining BritBlooms! We're delighted to have you as part of our floral family.
        </Text>

        <Text style={{ margin: '0 0 20px' }}>
          As a member, you'll enjoy:
        </Text>

        <ul style={{ margin: '0 0 20px', paddingLeft: '20px' }}>
          <li style={{ margin: '10px 0' }}>
            Early access to seasonal collections
          </li>
          <li style={{ margin: '10px 0' }}>
            Exclusive member discounts
          </li>
          <li style={{ margin: '10px 0' }}>
            Special birthday treats
          </li>
          <li style={{ margin: '10px 0' }}>
            Regular updates on new arrivals
          </li>
        </ul>

        <Hr style={{ margin: '30px 0' }} />

        <Text style={{ margin: '0 0 20px' }}>
          Ready to explore our beautiful collection?
        </Text>

        <Button
          href="https://britblooms.com/collections"
          style={{
            backgroundColor: '#3b82f6',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '16px',
            textDecoration: 'none',
            textAlign: 'center',
            display: 'block',
            padding: '12px 20px',
            margin: '0 auto 30px'
          }}
        >
          Shop Now
        </Button>

        <Text style={{ fontSize: '14px', color: '#666', textAlign: 'center', margin: '0 0 10px' }}>
          Need help? Contact our customer service team at
        </Text>
        <Text style={{ fontSize: '14px', color: '#666', textAlign: 'center', margin: '0' }}>
          support@britblooms.com
        </Text>
      </Section>
    </Base>
  )
}

CustomerWelcomeTemplate.PreviewProps = {
  customer: {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com'
  }
} as CustomerWelcomePreviewProps

export default CustomerWelcomeTemplate