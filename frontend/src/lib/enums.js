// Mirrors the enums declared on the backend entities exactly (string values
// matter — they're persisted and validated with @IsEnum on the server), so
// the admin UI can only ever submit values the backend will accept.

export const ORDER_STATUSES = [
  'Pending', 'Awaiting Payment', 'Payment Confirmed', 'Processing', 'Picking', 'Packed',
  'Ready for Collection', 'Ready for Dispatch', 'Dispatched', 'Out for Delivery', 'Delivered',
  'On hold', 'Payment failed', 'Partially fulfilled', 'Cancelled', 'Return requested',
  'Returned', 'Exchange processing', 'Refunded',
]

// backend/src/orders/orders.service.ts ALLOWED_TRANSITIONS, copied exactly so the
// admin Orders page only ever offers a status change the backend will accept.
export const ORDER_TRANSITIONS = {
  Pending: ['Awaiting Payment', 'Payment Confirmed', 'Cancelled'],
  'Awaiting Payment': ['Payment Confirmed', 'Payment failed', 'Cancelled'],
  'Payment Confirmed': ['Processing', 'Cancelled', 'Refunded'],
  Processing: ['Picking', 'On hold', 'Cancelled'],
  Picking: ['Packed', 'Partially fulfilled', 'On hold'],
  Packed: ['Ready for Collection', 'Ready for Dispatch'],
  'Ready for Collection': ['Delivered', 'Cancelled'],
  'Ready for Dispatch': ['Dispatched'],
  Dispatched: ['Out for Delivery', 'Delivered'],
  'Out for Delivery': ['Delivered', 'On hold'],
  Delivered: ['Return requested'],
  'On hold': ['Processing', 'Cancelled'],
  'Payment failed': ['Awaiting Payment', 'Cancelled'],
  'Partially fulfilled': ['Packed', 'Cancelled'],
  Cancelled: [],
  'Return requested': ['Returned', 'Exchange processing'],
  Returned: ['Refunded', 'Exchange processing'],
  'Exchange processing': ['Delivered', 'Refunded'],
  Refunded: [],
}

// The main happy-path fulfilment workflow, in order — for the customer-facing
// order-tracking timeline. Statuses outside this list (Cancelled, On hold,
// Payment failed, Return requested, etc.) are shown as a callout instead,
// since they're exceptions to the linear flow, not a step within it.
export const MAIN_ORDER_STEPS = [
  { label: 'Order placed', matches: ['Pending'] },
  { label: 'Awaiting payment', matches: ['Awaiting Payment'] },
  { label: 'Payment confirmed', matches: ['Payment Confirmed'] },
  { label: 'Processing', matches: ['Processing'] },
  { label: 'Picking', matches: ['Picking'] },
  { label: 'Packed', matches: ['Packed'] },
  { label: 'Ready for collection / dispatch', matches: ['Ready for Collection', 'Ready for Dispatch'] },
  { label: 'Dispatched', matches: ['Dispatched'] },
  { label: 'Out for delivery', matches: ['Out for Delivery'] },
  { label: 'Delivered', matches: ['Delivered'] },
]

export function mainStepIndex(status) {
  return MAIN_ORDER_STEPS.findIndex((step) => step.matches.includes(status))
}

export const DELIVERY_STATUSES = ['pending', 'packed', 'dispatched', 'out_for_delivery', 'delivered', 'failed', 'collected']

export const RETURN_STATUSES = ['requested', 'approved', 'rejected', 'received', 'refunded', 'exchanged']

export const STOCK_MOVEMENT_TYPES = ['receipt', 'sale', 'reservation', 'release', 'adjustment', 'transfer', 'return', 'damage']

export const USER_ROLES = ['customer', 'super_admin', 'owner', 'manager', 'staff']

export function humanize(value) {
  return String(value).replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
