import { useState } from 'react';
import { Check, Copy, Wallet } from 'lucide-react';
import { useDemoInfo } from '../hooks/useDemoInfo';

/**
 * The eSewa sandbox wallet to type in at checkout.
 *
 * <p>Renders nothing unless this is a demo deployment whose checkout points at eSewa's UAT
 * sandbox - the backend withholds these values otherwise, so a visitor is never shown test wallet
 * numbers for a gateway that would reject them.
 */
export function DemoWalletHint() {
  const demo = useDemoInfo();
  const [copied, setCopied] = useState('');

  if (!demo?.payment) return null;

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(''), 2000);
    } catch {
      // Clipboard access can be refused; every value is on screen to copy by hand.
    }
  };

  const rows: { label: string; value: string }[] = [
    { label: 'eSewa ID', value: demo.payment.esewaId },
    { label: 'Password', value: demo.payment.esewaPassword },
    { label: 'MPIN', value: demo.payment.mpin },
    { label: 'OTP', value: demo.payment.otp }
  ];

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2">
        <Wallet size={16} className="text-green-700" />
        <p className="text-xs font-black uppercase tracking-wide text-slate-900">eSewa test wallet</p>
      </div>
      <p className="mt-1.5 text-xs leading-5 text-slate-500">
        This is eSewa's sandbox. Use these details on the payment screen - no real money moves.
      </p>
      <dl className="mt-3 grid gap-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3">
            <dt className="text-xs text-slate-500">{row.label}</dt>
            <dd>
              <button
                type="button"
                onClick={() => copy(row.label, row.value)}
                title={`Copy ${row.label}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 font-mono text-xs text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                {row.value}
                {copied === row.label
                  ? <Check size={12} className="text-green-600" />
                  : <Copy size={12} className="text-slate-400" />}
              </button>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
