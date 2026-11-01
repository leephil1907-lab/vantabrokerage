'use client';

import { useState, type InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; note?: string; hint?: string; trailing?: React.ReactNode };

export function AuthField({ label, note, hint, trailing, id, ...props }: Props) {
  return <label className="auth-label" htmlFor={id}>
    <span className="auth-label-head"><span>{label}{note && <span className="auth-label-note"> {note}</span>}</span>{trailing}</span>
    <span className="auth-input-wrap block"><input id={id} className="auth-input" {...props} /></span>
    {hint && <span className="auth-hint block">{hint}</span>}
  </label>;
}

export function PasswordField({ label, hint, trailing, id, ...props }: Props) {
  const [visible, setVisible] = useState(false);
  return <div>
    <div className="auth-label"><span className="auth-label-head"><label htmlFor={id}>{label}</label>{trailing}</span></div>
    <div className="auth-input-wrap"><input id={id} className="auth-input has-toggle" type={visible ? 'text' : 'password'} {...props} />
      <button type="button" className="auth-toggle" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible}>{visible ? 'Hide' : 'Show'}</button>
    </div>
    {hint && <p className="auth-hint" id={id ? `${id}-hint` : undefined}>{hint}</p>}
  </div>;
}

export function AuthError({ message }: { message: string | null }) {
  return message ? <p role="alert" className="auth-error">{message}</p> : null;
}
