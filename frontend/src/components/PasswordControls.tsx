import { CheckCircle2, Eye, EyeOff, KeyRound, XCircle } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Field } from './UI';
import { passwordRequirements } from '../utils/validation';
import type { PasswordContext } from '../utils/validation';

/**
 * A password input with a show/hide toggle. Worth the extra control now that a password has to
 * satisfy several rules at once - being unable to see what you typed turns one typo into a
 * checklist that refuses to go green for no visible reason.
 */
export function PasswordField({
  label,
  value,
  onChange,
  onBlur,
  error,
  autoComplete,
  required
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <Field
      label={label}
      type={visible ? 'text' : 'password'}
      value={value}
      required={required}
      autoComplete={autoComplete}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      error={error}
      prefix={<KeyRound size={18} />}
      suffix={(
        <button
          type="button"
          className="rounded-full p-1 text-slate-500 hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-green-100"
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      )}
      aria-invalid={Boolean(error)}
    />
  );
}

/**
 * The live checklist under a new-password field. It reads the same predicates that decide whether
 * the form can be submitted, so a visitor can watch every rule turn green rather than being told
 * at submit time which one they missed.
 */
export function PasswordRequirements({
  password,
  context,
  matches
}: {
  password: string;
  context?: PasswordContext;
  matches?: boolean;
}) {
  const items = passwordRequirements(password, context);
  return (
    <div className="grid gap-2 rounded-3xl bg-slate-50 p-4 text-sm font-semibold text-slate-600 sm:grid-cols-2">
      {items.map((item) => (
        <Requirement key={item.label} met={item.met}>{item.label}</Requirement>
      ))}
      {matches !== undefined && <Requirement met={matches}>Confirmation matches</Requirement>}
    </div>
  );
}

function Requirement({ met, children }: { met: boolean; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-2 ${met ? 'text-green-700' : 'text-slate-500'}`}>
      {met ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
      {children}
    </span>
  );
}
