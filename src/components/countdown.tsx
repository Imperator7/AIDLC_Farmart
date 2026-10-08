"use client";

import { useEffect, useState } from "react";
import { ClockIcon } from "./icons";

const pad = (n: number) => String(n).padStart(2, "0");

/** Counts down to `endsAt` (ISO time from the Top Saver API); without it, to the end of today in local time. */
export default function Countdown({ endsAt }: { endsAt?: string }) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const end = endsAt ? new Date(endsAt) : new Date();
      if (!endsAt) end.setHours(24, 0, 0, 0);
      // Deals reset daily. A cached page can carry yesterday's end just after midnight; count to the next one instead of sitting at 00:00:00.
      while (end.getTime() <= Date.now()) end.setTime(end.getTime() + 86_400_000);
      setLeft(Math.max(0, Math.floor((end.getTime() - Date.now()) / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  const time = left === null ? "--:--:--" : `${pad(Math.floor(left / 3600))}:${pad(Math.floor((left % 3600) / 60))}:${pad(left % 60)}`;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm bg-red-600 px-3 py-1 text-xs font-semibold whitespace-nowrap text-white">
      <ClockIcon size={13} />
      Expires in <span className="tabular-nums">{time}</span>
    </span>
  );
}
