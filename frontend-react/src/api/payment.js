import { apiFetch } from './client.js';

export const PaymentAPI = {
  confirm: (userId, slotId, notes, method) => apiFetch('/payments/confirm', {
    method: 'POST',
    body: JSON.stringify({ userId, slotId, notes, method })
  })
};

