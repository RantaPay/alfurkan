"use client";

import { useEffect, useRef, type HTMLAttributes } from "react";

const focusable = 'button:not([disabled]), a[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]';
let openCount = 0;
let originalOverflow = "";

/** Focus and scroll ownership stay with the last visible dialog, including nested dialogs. */
export function Dialog({ onClose, label, children, ...props }: HTMLAttributes<HTMLDivElement> & { onClose: () => void; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const element = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    if (openCount++ === 0) {
      originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    const isTopmost = () => {
      const dialogs = Array.from(document.querySelectorAll<HTMLElement>('[data-app-dialog="true"]')).filter(dialog => dialog.getClientRects().length > 0);
      return dialogs[dialogs.length - 1] === element;
    };
    const controls = () => Array.from(element.querySelectorAll<HTMLElement>(focusable)).filter(control => control.getClientRects().length > 0 && !control.closest('[inert]'));
    const focusFirst = () => (controls()[0] || element).focus({ preventScroll: true });
    const frame = requestAnimationFrame(() => { if (isTopmost()) focusFirst(); });
    const handleFocus = (event: FocusEvent) => {
      if (isTopmost() && !element.contains(event.target as Node)) focusFirst();
    };
    const handleKey = (event: KeyboardEvent) => {
      if (!isTopmost()) return;
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); closeRef.current(); }
      if (event.key !== "Tab") return;
      const items = controls();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first) { event.preventDefault(); element.focus(); }
      else if (event.shiftKey && (document.activeElement === first || !element.contains(document.activeElement) || document.activeElement === element)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !element.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("focusin", handleFocus);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("focusin", handleFocus);
      if (--openCount === 0) document.body.style.overflow = originalOverflow;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  return <div {...props} ref={ref} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} data-app-dialog="true">{children}</div>;
}
