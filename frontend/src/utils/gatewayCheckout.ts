import type { PaymentInitiation } from '../types/api';

/**
 * Key under which the in-flight transaction id is parked while the browser is away at the
 * gateway. The failure page uses it to release the slot hold, because eSewa never tells our
 * server that the user walked away.
 */
const PENDING_TRANSACTION_KEY = 'futsal_pending_payment';

export function rememberPendingTransaction(transactionId: string) {
  try {
    sessionStorage.setItem(PENDING_TRANSACTION_KEY, transactionId);
  } catch {
    // Private-mode browsers can throw here. The scheduled server-side sweep still frees the
    // slot, so this is only an optimisation.
  }
}

export function takePendingTransaction(): string | null {
  try {
    const value = sessionStorage.getItem(PENDING_TRANSACTION_KEY);
    sessionStorage.removeItem(PENDING_TRANSACTION_KEY);
    return value;
  } catch {
    return null;
  }
}

/**
 * Hands the browser off to the gateway.
 *
 * eSewa only accepts a form POST carrying the server-computed signature, so the fields are
 * submitted through a real form element rather than a query string.
 */
export function handOffToGateway(initiation: PaymentInitiation) {
  if (initiation.transactionId) {
    rememberPendingTransaction(initiation.transactionId);
  }

  if (initiation.formUrl && initiation.formFields) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = initiation.formUrl;
    form.style.display = 'none';

    Object.entries(initiation.formFields).forEach(([name, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    return;
  }

  throw new Error('The payment gateway did not return a way to continue.');
}
