import type { ReactNode } from "react";

/**
 * Dashed skeletons for screens that aren't built yet, so there is nothing to screenshot.
 * Built screens use real screenshots instead (see ScreenData.shot).
 */

const Bar = ({ className = "" }: { className?: string }) => <div className={`h-1 rounded-full bg-gray-200 ${className}`} />;
const Dashed = ({ className = "" }: { className?: string }) => <div className={`rounded-sm border border-dashed border-gray-300 ${className}`} />;

function Frame({ children }: { children: ReactNode }) {
  return (
    <div aria-hidden className="relative aspect-[16/10] overflow-hidden rounded-md border border-dashed border-gray-300 bg-gray-50">
      {children}
    </div>
  );
}

function Checkout() {
  return (
    <Frame>
      <div className="flex items-center justify-center gap-1 py-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="h-2.5 w-2.5 rounded-full border border-dashed border-gray-400" />
            {i < 2 && <div className="w-8 border-t border-dashed border-gray-300" />}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 px-2.5">
        <div className="col-span-2 space-y-1.5">
          {[0, 1, 2, 3].map((i) => (
            <Dashed key={i} className="h-4" />
          ))}
        </div>
        <div className="space-y-1 rounded-sm border border-dashed border-gray-300 p-1.5">
          <Bar />
          <Bar />
          <Bar className="w-2/3" />
          <Dashed className="mt-5 h-3 border-gray-400" />
        </div>
      </div>
    </Frame>
  );
}

function Category() {
  return (
    <Frame>
      <div className="h-5 border-b border-dashed border-gray-300" />
      <div className="flex gap-2 p-2.5">
        <div className="w-1/4 space-y-1.5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-sm border border-dashed border-gray-400" />
              <Bar className="flex-1" />
            </div>
          ))}
        </div>
        <div className="grid flex-1 grid-cols-4 gap-1">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Dashed key={i} className="h-[50px]" />
          ))}
        </div>
      </div>
    </Frame>
  );
}

export const wireframes: Record<string, () => ReactNode> = { checkout: Checkout, category: Category };
