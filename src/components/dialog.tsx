"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "./ui";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
  /** Label of the main action. Omit for a notice with only a close button. */
  confirmLabel?: string;
  onConfirm?: () => void;
  cancelLabel?: string;
  /** Destructive dialogs use button-danger and start focus on Cancel. */
  tone?: "default" | "danger";
};

/** Visual shell of the dialog (DESIGN.md `dialog`). Shared by the modal and the static /design preview. */
export function DialogPanel({
  title,
  titleId,
  descId,
  children,
  confirmLabel,
  onConfirm,
  cancelLabel = "Cancel",
  onCancel,
  tone = "default",
  cancelRef,
  confirmRef,
}: Omit<DialogProps, "open" | "onClose"> & {
  titleId?: string;
  descId?: string;
  onCancel?: () => void;
  cancelRef?: React.Ref<HTMLButtonElement>;
  confirmRef?: React.Ref<HTMLButtonElement>;
}) {
  return (
    <div className="w-full rounded-md bg-white p-6 shadow-2xl">
      <h2 id={titleId} className="text-lg font-bold text-gray-900">
        {title}
      </h2>
      {children && (
        <div id={descId} className="mt-2 text-sm leading-relaxed text-gray-700">
          {children}
        </div>
      )}
      <div className="mt-6 flex gap-3 sm:justify-end">
        <Button ref={cancelRef} variant="ghost" onClick={onCancel} className="flex-1 sm:flex-none">
          {confirmLabel ? cancelLabel : "Close"}
        </Button>
        {confirmLabel && (
          <Button ref={confirmRef} variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} className="flex-1 sm:flex-none">
            {confirmLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Modal dialog on the native <dialog> element: focus trap, Escape, top-layer stacking
 * and an inert page come from the browser. We add scrim click, scroll lock, focus
 * restore and the enter/leave animation.
 */
export default function Dialog({ open, onClose, onConfirm, tone = "default", ...panel }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el || !open) return;
    const trigger = document.activeElement as HTMLElement | null;
    el.showModal();
    (tone === "danger" || !panel.confirmLabel ? cancelRef : confirmRef).current?.focus();
    document.documentElement.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => {
      cancelAnimationFrame(frame);
      setVisible(false);
      el.close();
      document.documentElement.style.overflow = "";
      trigger?.focus();
    };
  }, [open, tone, panel.confirmLabel]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={panel.children ? descId : undefined}
      // Escape: keep our state in charge instead of letting the browser close it.
      // Other Escape handlers (e.g. the cart drawer) must skip while a `dialog:modal` is open.
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // A click whose target is the <dialog> itself landed on the backdrop.
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className={`m-auto w-[calc(100%-2rem)] max-w-[400px] bg-transparent p-0 transition duration-150 backdrop:bg-black/40 backdrop:transition-opacity backdrop:duration-150 ${
        visible ? "scale-100 opacity-100 backdrop:opacity-100" : "scale-95 opacity-0 backdrop:opacity-0 motion-reduce:scale-100"
      }`}
    >
      {open && (
        <DialogPanel
          {...panel}
          tone={tone}
          titleId={titleId}
          descId={descId}
          onCancel={onClose}
          onConfirm={() => {
            onConfirm?.();
            onClose();
          }}
          cancelRef={cancelRef}
          confirmRef={confirmRef}
        />
      )}
    </dialog>
  );
}
