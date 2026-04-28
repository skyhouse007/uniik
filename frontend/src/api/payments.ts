import { authedPost } from './authed'

export type CreatePaymentOrderRequest = {
  amountInPaise: number
  currency?: string
  receipt?: string
}

export type CreatePaymentOrderResponse = {
  razorpayOrderId: string
  amount: number
  currency: string
  keyId: string
}

export async function createPaymentOrder(token: string, payload: CreatePaymentOrderRequest) {
  return await authedPost<CreatePaymentOrderResponse>('/payments/razorpay/order', payload, token)
}

export type PaymentFailRequest = {
  razorpay_order_id: string
  error?: {
    code?: string
    description?: string
  }
}

export async function recordPaymentFailure(token: string, payload: PaymentFailRequest) {
  return await authedPost<{ ok: true }>('/payments/razorpay/fail', payload, token)
}

export type PaymentLineItem = {
  productId: string
  name: string
  image?: string
  quantity: number
  selectedVariantCategory?: string
  selectedSize: string
  selectedThickness: string
  unitPrice: number
}

export type VerifyPaymentRequest = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  address: {
    fullName: string
    phone: string
    line1: string
    line2?: string
    city: string
    state: string
    pincode: string
    landmark?: string
  }
  lineItems: PaymentLineItem[]
  couponDiscount?: number
  shipping?: number
}

export type VerifyPaymentResponse = {
  ok: true
  orderId: string
}

export async function verifyPayment(token: string, payload: VerifyPaymentRequest) {
  return await authedPost<VerifyPaymentResponse>('/payments/razorpay/verify', payload, token)
}
