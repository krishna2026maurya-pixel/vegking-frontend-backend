/**
 * Centralized Order Status State Machine & Rules
 * Enforces forward-only progression across Admin, Vendor, Rider, and Customer.
 */

export const FORWARD_ORDER_STEPS = [
  'Order Placed',
  'Order Confirmed',
  'Packing',
  'Out for Delivery',
  'Delivered',
] as const;

export type ForwardOrderStatus = typeof FORWARD_ORDER_STEPS[number];

export const ORDER_STEP_INDEX: Record<string, number> = {
  'Order Placed': 0,
  'Order Confirmed': 1,
  'Packing': 2,
  'Out for Delivery': 3,
  'Delivered': 4,
};

export const ORDER_STATUS_DETAILS: Record<string, {
  label: string;
  step: number;
  color: string;
  badgeBg: string;
  description: string;
}> = {
  'Order Placed': {
    label: 'Order Placed',
    step: 0,
    color: 'text-blue-600 dark:text-blue-400',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    description: 'We have received your order and sent it to the vendor.',
  },
  'Order Confirmed': {
    label: 'Order Confirmed',
    step: 1,
    color: 'text-violet-600 dark:text-violet-400',
    badgeBg: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800',
    description: 'Vendor has accepted and confirmed your produce order.',
  },
  'Packing': {
    label: 'Packing',
    step: 2,
    color: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    description: 'Fresh produce is being sorted, weighed, and packed.',
  },
  'Out for Delivery': {
    label: 'Out for Delivery',
    step: 3,
    color: 'text-orange-600 dark:text-orange-400',
    badgeBg: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
    description: 'Rider is on the way to your delivery address.',
  },
  'Delivered': {
    label: 'Delivered',
    step: 4,
    color: 'text-green-600 dark:text-green-400',
    badgeBg: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800',
    description: 'Order successfully handed over and verified via OTP.',
  },
  'Cancelled': {
    label: 'Cancelled',
    step: -1,
    color: 'text-red-600 dark:text-red-400',
    badgeBg: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
    description: 'Order was cancelled and will not be delivered.',
  },
};

export const STATUS_STR_TO_NUM: Record<string, number> = {
  'Order Placed': 0,
  'Order Confirmed': 1,
  'Packing': 2,
  'Out for Delivery': 3,
  'Delivered': 4,
  'Cancelled': 5,
};

export const STATUS_NUM_TO_STR: Record<number, string> = {
  0: 'Order Placed',
  1: 'Order Confirmed',
  2: 'Packing',
  3: 'Out for Delivery',
  4: 'Delivered',
  5: 'Cancelled',
};

/**
 * Standardize any legacy string, lowercase string, or number to canonical status
 */
export function normalizeOrderStatus(status: any): string {
  if (typeof status === 'number') {
    return STATUS_NUM_TO_STR[status] || 'Order Placed';
  }
  if (!status || typeof status !== 'string') return 'Order Placed';
  const s = status.trim().toLowerCase();
  if (s === '0' || s.includes('placed')) return 'Order Placed';
  if (s === '1' || s.includes('confirm') || s.includes('accept')) return 'Order Confirmed';
  if (s === '2' || s.includes('pack') || s.includes('process')) return 'Packing';
  if (s === '3' || s.includes('out') || s.includes('way') || s.includes('transit') || s.includes('dispatch')) return 'Out for Delivery';
  if (s === '4' || s.includes('deliver') || s.includes('complete')) return 'Delivered';
  if (s === '5' || s.includes('cancel')) return 'Cancelled';
  return status;
}

/**
 * Returns allowed next statuses for a given current status.
 * Strictly enforces forward direction and terminal states.
 */
export function getAllowedNextStatuses(currentStatus: string): string[] {
  const norm = normalizeOrderStatus(currentStatus);

  switch (norm) {
    case 'Order Placed':
      return ['Order Placed', 'Order Confirmed', 'Packing', 'Out for Delivery', 'Delivered', 'Cancelled'];
    case 'Order Confirmed':
      return ['Order Confirmed', 'Packing', 'Out for Delivery', 'Delivered', 'Cancelled'];
    case 'Packing':
      return ['Packing', 'Out for Delivery', 'Delivered'];
    case 'Out for Delivery':
      return ['Out for Delivery', 'Delivered'];
    case 'Delivered':
      return ['Delivered']; // Terminal state
    case 'Cancelled':
      return ['Cancelled']; // Terminal state
    default:
      return ['Order Confirmed', 'Packing', 'Out for Delivery', 'Delivered'];
  }
}

/**
 * Validates whether transition from currentStatus to nextStatus is allowed.
 * Prevents any backwards movement in status.
 */
export function canTransitionStatus(
  currentStatus: string | undefined | null, 
  nextStatus: string | undefined | null
): { allowed: boolean; reason?: string } {
  const normCurrent = normalizeOrderStatus(currentStatus);
  const normNext = normalizeOrderStatus(nextStatus);

  // Identity transition is always fine (no change)
  if (normCurrent === normNext) {
    return { allowed: true };
  }

  // Terminal state 1: Delivered
  if (normCurrent === 'Delivered') {
    return {
      allowed: false,
      reason: 'This order has already been Delivered. Status cannot be modified or moved backwards.',
    };
  }

  // Terminal state 2: Cancelled
  if (normCurrent === 'Cancelled') {
    return {
      allowed: false,
      reason: 'This order has been Cancelled. Terminal status cannot be altered.',
    };
  }

  // Cancellation transition rules: Only allowed before dispatch (Order Placed / Order Confirmed)
  if (normNext === 'Cancelled') {
    const currentIndex = ORDER_STEP_INDEX[normCurrent] ?? 0;
    if (currentIndex >= 2) { // Packing, Out for Delivery, Delivered
      return {
        allowed: false,
        reason: `Cannot cancel an order that is already in "${normCurrent}" stage.`,
      };
    }
    return { allowed: true };
  }

  const currentIndex = ORDER_STEP_INDEX[normCurrent];
  const nextIndex = ORDER_STEP_INDEX[normNext];

  if (currentIndex !== undefined && nextIndex !== undefined) {
    if (nextIndex < currentIndex) {
      return {
        allowed: false,
        reason: `Status cannot move backwards from "${normCurrent}" to "${normNext}". Orders can only advance forward in sequence.`,
      };
    }
    return { allowed: true };
  }

  return { allowed: true };
}
