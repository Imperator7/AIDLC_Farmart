/**
 * Design-system primitives. Each maps 1:1 to a component in DESIGN.md —
 * change the spec there first, then update the classes here.
 */
import Link from "next/link";

const buttonVariants = {
  // button-primary (+ button-primary-hover)
  primary: "bg-amber-400 text-gray-900 hover:bg-amber-500",
  // button-dark: on white banners; flips to amber so it still lands on the brand color
  dark: "bg-gray-900 text-white hover:bg-amber-400 hover:text-gray-900",
  // button-light: on amber surfaces where amber-on-amber would vanish
  light: "bg-white text-gray-900 shadow-sm hover:bg-gray-900 hover:text-white",
  // button-ghost: the quiet "back out" action next to a stronger button
  ghost: "border border-gray-200 bg-white text-gray-900 hover:bg-gray-50",
  // button-danger: confirms an irreversible action, only inside a dialog
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const buttonSizes = {
  md: "px-6 py-2.5 text-xs",
  lg: "px-6 py-3 text-sm", // full-width drawer actions
};

type ButtonProps = {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  href?: string;
  className?: string;
  children: React.ReactNode;
  ref?: React.Ref<HTMLButtonElement>;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className">;

export function Button({ variant = "primary", size = "md", href, className = "", children, ...rest }: ButtonProps) {
  const cls = `inline-flex items-center justify-center rounded font-bold transition-colors ${buttonSizes[size]} ${buttonVariants[variant]} ${className}`;
  if (href) {
    // Store paths navigate client-side; anything else stays a plain link.
    return href.startsWith("/") ? (
      <Link href={href} className={cls}>
        {children}
      </Link>
    ) : (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}

/** badge-discount */
export function DiscountBadge({ percent, className = "" }: { percent: number; className?: string }) {
  return <span className={`rounded-sm bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white ${className}`}>Save {percent}%</span>;
}

/** count-badge */
/** count-badge: hidden at 0, because an empty count is noise. */
export function CountBadge({ count, className = "" }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return <span className={`rounded-full bg-amber-400 px-1.5 text-[10px] font-bold text-gray-900 ${className}`}>{count}</span>;
}
