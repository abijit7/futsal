import { X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { createPortal } from 'react-dom';

type Tone = 'green' | 'navy' | 'amber' | 'red' | 'slate';

const toneClasses: Record<Tone, string> = {
  green: 'bg-green-50 text-green-700 ring-green-100',
  navy: 'bg-slate-950 text-white ring-slate-900',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  red: 'bg-red-50 text-red-700 ring-red-100',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200'
};

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-navy',
  outline: 'btn-soft',
  ghost: 'border border-transparent bg-transparent text-slate-600 shadow-none hover:bg-slate-100 hover:text-slate-950 focus:ring-green-100',
  destructive: 'border border-red-100 bg-red-600 text-white shadow-lg shadow-red-600/15 hover:bg-red-700 focus:ring-red-100'
};

const buttonSizes: Record<Size, string> = {
  sm: 'min-h-10 rounded-xl px-3 py-2 text-sm',
  md: 'min-h-12 rounded-2xl px-5 py-3 text-sm',
  lg: 'min-h-14 rounded-2xl px-6 py-4 text-base'
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  className = '',
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: Size; loading?: boolean }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-bold transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-4 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:active:scale-100 ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}

export function IconButton({
  label,
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:text-green-700 focus:outline-none focus:ring-4 focus:ring-green-100 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  action,
  icon
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <section className="mb-8 overflow-hidden rounded-3xl bg-slate-950 p-7 text-white shadow-xl shadow-slate-950/10 md:p-9">
      <div className="grid items-center gap-5 md:grid-cols-[1fr_auto]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-green-300">{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">{title}</h1>
          {description && <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">{description}</p>}
        </div>
        {(action || icon) && (
          <div className="flex items-center gap-3 md:justify-end">
            {icon && <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-green-300 ring-1 ring-white/10">{icon}</div>}
            {action}
          </div>
        )}
      </div>
    </section>
  );
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  action,
  meta
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-slate-200 bg-white p-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-slate-500">{description}</p>
        </div>
        {(action || meta) && <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:justify-end">{meta}{action}</div>}
      </div>
    </div>
  );
}

export function MetricCard({ label, value, icon, tone = 'green', hint }: { label: string; value: ReactNode; icon?: ReactNode; tone?: Tone; hint?: string }) {
  return (
    <article className="panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
          {hint && <p className="mt-1 text-xs font-bold text-slate-500">{hint}</p>}
        </div>
        {icon && <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${toneClasses[tone]}`}>{icon}</div>}
      </div>
    </article>
  );
}

export function FilterBar({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`panel grid gap-3 p-4 ${className}`}>{children}</div>;
}

export function Chip({ children, tone = 'slate', onRemove }: { children: ReactNode; tone?: Tone; onRemove?: () => void }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ring-1 ${toneClasses[tone]}`}>
      {children}
      {onRemove && (
        <button
          type="button"
          aria-label="Remove filter"
          className="-mr-1.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-current"
          onClick={onRemove}
        >
          <X size={13} />
        </button>
      )}
    </span>
  );
}

export function Field({
  label,
  helper,
  error,
  required,
  prefix,
  suffix,
  className = '',
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix' | 'size'> & { label?: string; helper?: string; error?: string; prefix?: ReactNode; suffix?: ReactNode }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="label">{label}{required && <span className="text-red-500"> *</span>}</span>}
      <span className="relative block">
        {prefix && <span className="input-icon input-icon-left pointer-events-none text-slate-400">{prefix}</span>}
        <input className={`input min-h-12 ${prefix ? 'input-with-prefix' : ''} ${suffix ? 'input-with-suffix' : ''} ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`} required={required} {...props} />
        {suffix && <span className="input-icon input-icon-right text-slate-400">{suffix}</span>}
      </span>
      {(helper || error) && <span className={`mt-2 block text-xs font-semibold ${error ? 'text-red-600' : 'text-slate-500'}`}>{error || helper}</span>}
    </label>
  );
}

export function SelectField({
  label,
  helper,
  error,
  required,
  children,
  className = '',
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; helper?: string; error?: string }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="label">{label}{required && <span className="text-red-500"> *</span>}</span>}
      <select className={`input min-h-12 ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`} required={required} {...props}>
        {children}
      </select>
      {(helper || error) && <span className={`mt-2 block text-xs font-semibold ${error ? 'text-red-600' : 'text-slate-500'}`}>{error || helper}</span>}
    </label>
  );
}

export function TextareaField({
  label,
  helper,
  error,
  required,
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; helper?: string; error?: string }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="label">{label}{required && <span className="text-red-500"> *</span>}</span>}
      <textarea className={`input min-h-28 ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`} required={required} {...props} />
      {(helper || error) && <span className={`mt-2 block text-xs font-semibold ${error ? 'text-red-600' : 'text-slate-500'}`}>{error || helper}</span>}
    </label>
  );
}

/**
 * Escape-to-close plus a focus trap for any dialog panel.
 *
 * <p>Exported so the hand-built admin dialogs get the same keyboard behaviour as {@link ModalShell}
 * instead of each re-implementing (or, previously, omitting) it.
 */
export function useDialogBehavior(panelRef: { current: HTMLElement | null }, onClose: () => void) {
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusables = () => Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) || []
    );

    focusables()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [onClose, panelRef]);
}

/**
 * Backdrop + centred panel for a dialog whose body is too bespoke for {@link ModalShell}
 * (the venue form's tabbed header, for instance). Mount it only while the dialog is open.
 */
export function DialogFrame({
  onClose,
  className = 'max-w-lg',
  children
}: {
  onClose: () => void;
  className?: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  useDialogBehavior(panelRef, onClose);

  const dialog = (
    <div className="admin-modal-backdrop fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/45 p-4">
      <button type="button" aria-label="Close dialog" className="absolute inset-0 cursor-default" onClick={onClose} />
      <div ref={panelRef} role="dialog" aria-modal="true" className={`admin-modal-panel relative z-10 w-full ${className}`}>
        {children}
      </div>
    </div>
  );

  return typeof document === 'undefined' ? dialog : createPortal(dialog, document.body);
}

export function ModalShell({
  title,
  eyebrow,
  description,
  children,
  footer,
  onClose,
  maxWidth = 'max-w-lg'
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  maxWidth?: string;
}) {
  const panelRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  useDialogBehavior(panelRef, onClose);

  const modal = (
    <div className="admin-modal-backdrop fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/45 p-4">
      <button type="button" aria-label="Close modal" className="absolute inset-0 cursor-default" onClick={onClose} />
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`admin-modal-panel relative z-10 w-full ${maxWidth} overflow-hidden rounded-3xl bg-white shadow-2xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h3 id={titleId} className="mt-1 text-2xl font-black text-slate-950">{title}</h3>
            {description && <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{description}</p>}
          </div>
          <IconButton label="Close modal" onClick={onClose}><X size={20} /></IconButton>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end">{footer}</div>}
      </section>
    </div>
  );

  return typeof document === 'undefined' ? modal : createPortal(modal, document.body);
}
