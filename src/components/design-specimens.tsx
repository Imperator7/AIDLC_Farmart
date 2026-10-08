"use client";

import { useState } from "react";
import { useCart } from "./cart-context";
import Dialog from "./dialog";
import { AddPill, QtyPill } from "./product-card";
import { Button } from "./ui";

/** add-button → qty-stepper demo with local state (doesn't touch the real cart). */
export function CartControlDemo({ size = "md" }: { size?: "md" | "lg" }) {
  const [qty, setQty] = useState(0);
  return (
    <div className={size === "lg" ? "w-72" : "w-40"}>
      {qty === 0 ? (
        <AddPill name="Demo item" onAdd={() => setQty(1)} size={size} />
      ) : (
        <QtyPill name="Demo item" qty={qty} onChange={setQty} size={size} />
      )}
    </div>
  );
}

/** Opens the real modal dialog in both tones. */
export function DialogDemo() {
  const [open, setOpen] = useState<"default" | "danger" | null>(null);
  return (
    <>
      <Button variant="ghost" onClick={() => setOpen("default")}>
        Open dialog
      </Button>
      <Button variant="danger" onClick={() => setOpen("danger")}>
        Open danger dialog
      </Button>
      <Dialog
        open={open === "default"}
        onClose={() => setOpen(null)}
        title="Apply member discount?"
        confirmLabel="Apply 15% off"
      >
        Your 15% new-member code will be applied to this order.
      </Dialog>
      <Dialog
        open={open === "danger"}
        onClose={() => setOpen(null)}
        title="Clear your cart?"
        tone="danger"
        confirmLabel="Clear cart"
      >
        All items will be removed. This can&apos;t be undone.
      </Dialog>
    </>
  );
}

export function OpenCartButton() {
  const { setOpen, count } = useCart();
  return (
    <Button onClick={() => setOpen(true)}>
      Open cart drawer {count > 0 && `(${count} items)`}
    </Button>
  );
}
