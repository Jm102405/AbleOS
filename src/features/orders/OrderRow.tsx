import { ChevronRightIcon } from "lucide-react";
import type { OrderLike } from "./OrderDetailModal";

type OrderRowProps = {
  order: OrderLike;
  onOpen: (order: OrderLike) => void;
};

/** Title only. Everything else lives in the detail sheet. */
export function OrderRow({ order, onOpen }: OrderRowProps) {
  return (
    <button
      className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-[#DCE4EE] bg-white px-4 py-4 text-left shadow-[0_4px_12px_rgba(30,58,138,0.045)] transition-all hover:-translate-y-0.5 hover:border-[#B7C7DC] hover:shadow-[0_8px_18px_rgba(30,58,138,0.1)] active:translate-y-0 sm:px-5"
      onClick={() => onOpen(order)}
      type="button"
    >
      <span className="min-w-0 flex-1 text-[18px] font-medium leading-[1.4] tracking-[-0.01em] text-[#1A1A2E]">
        {order.order_name}
      </span>

      <ChevronRightIcon
        aria-hidden="true"
        className="shrink-0 text-[#C3CEDC]"
        size={20}
        strokeWidth={2.25}
      />
    </button>
  );
}
