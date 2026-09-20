import { ArrowUp, ArrowDown } from 'lucide-react';

/**
 * Small up/down price-change indicator. Convention used here: a price
 * INCREASE is shown in red (costs more), a DECREASE in green (costs less)
 * — from the buyer/admin's point of view, not a stock-ticker convention.
 * Renders nothing when there's no previous price or no change.
 */
export default function PriceTrend({ current, previous }: { current: number; previous: number | null | undefined }) {
  if (previous === null || previous === undefined) return null;
  const diff = current - previous;
  if (Math.abs(diff) < 0.005) return null;

  const up = diff > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${up ? 'text-red-600' : 'text-green-600'}`}
      title={`${up ? 'Up' : 'Down'} ₹${Math.abs(diff).toFixed(2)} from ₹${previous.toFixed(2)}`}
    >
      {up ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
      ₹{Math.abs(diff).toFixed(2)}
    </span>
  );
}