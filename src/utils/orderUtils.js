const ORDER_STATUS_ALIASES = {
  pending: ['pending', 'unpaid', 'awaiting_payment', 'awaiting payment', 'waiting_payment', 'waiting payment', 'pending_payment', 'pending payment', 'to_pay', 'topay'],
  waiting: ['waiting', 'paid', 'processing', 'confirmed'],
  verifying: ['verifying', 'checking', 'reviewing'],
  shipping: ['shipping', 'shipped', 'in_transit', 'in transit', 'delivering'],
  cancelled: ['cancelled', 'canceled', 'rejected', 'failed'],
  completed: ['completed', 'complete', 'delivered', 'success'],
};

const ORDER_RESPONSE_CANDIDATE_KEYS = ['data', 'orders', 'results', 'items'];

const normalizeRawStatus = (order = {}) => {
  const rawStatus = order.status ?? order.order_status ?? order.payment_status ?? order.paymentStatus;
  return rawStatus == null ? '' : String(rawStatus).trim().toLowerCase();
};

export const normalizeOrderStatus = (order = {}) => {
  const rawStatus = normalizeRawStatus(order);

  if (!rawStatus) {
    return '';
  }

  const matchedEntry = Object.entries(ORDER_STATUS_ALIASES).find(([, aliases]) => aliases.includes(rawStatus));
  return matchedEntry ? matchedEntry[0] : rawStatus;
};

export const isPendingPaymentOrder = (order = {}) => normalizeOrderStatus(order) === 'pending';

export const extractOrders = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (!response || typeof response !== 'object') {
    return [];
  }

  for (const key of ORDER_RESPONSE_CANDIDATE_KEYS) {
    if (Array.isArray(response[key])) {
      return response[key];
    }
  }

  for (const key of ORDER_RESPONSE_CANDIDATE_KEYS) {
    const nestedValue = response[key];
    if (!nestedValue || typeof nestedValue !== 'object') {
      continue;
    }

    for (const nestedKey of ORDER_RESPONSE_CANDIDATE_KEYS) {
      if (Array.isArray(nestedValue[nestedKey])) {
        return nestedValue[nestedKey];
      }
    }
  }

  return [];
};
