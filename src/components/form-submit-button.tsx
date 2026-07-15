"use client";

import { useFormStatus } from "react-dom";

export function FormSubmitButton({
  children,
  pendingLabel = "Saving…",
  confirmMessage,
  className,
  disabled = false,
  formAction,
  title,
  ariaLabel,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  confirmMessage?: string;
  className: string;
  disabled?: boolean;
  formAction?: (formData: FormData) => void | Promise<void>;
  title?: string;
  ariaLabel?: string;
}) {
  const { pending } = useFormStatus();
  return <button type="submit" formAction={formAction} disabled={disabled || pending} title={title} aria-label={ariaLabel} onClick={(event) => {
    if (confirmMessage && !window.confirm(confirmMessage)) event.preventDefault();
  }} className={className}>{pending ? pendingLabel : children}</button>;
}
