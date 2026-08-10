import React from "react";
import { BellRingIcon, LoaderIcon } from "lucide-react";
import {
  disablePush,
  enablePush,
  getPushState,
  type PushState,
} from "../lib/push";

/**
 * Lives in the account menu. Each person has to turn this on per device -
 * a phone subscription can't be created on their behalf from a laptop.
 */
export function PushToggle() {
  const [state, setState] = React.useState<PushState>("default");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    setState(getPushState());
  }, []);

  async function handleEnable() {
    setBusy(true);
    setError("");
    try {
      setState(await enablePush());
    } catch (err) {
      console.error("Enable push failed:", err);
      setError(err instanceof Error ? err.message : "Could not turn these on");
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    setBusy(true);
    setError("");
    try {
      await disablePush();
      setState("default");
    } catch (err) {
      console.error("Disable push failed:", err);
      setError("Could not turn these off");
    } finally {
      setBusy(false);
    }
  }

  if (state === "unsupported") return null;

  return (
    <div className="border-t border-[#E6ECF2] px-4 py-3">
      <p className="text-[16px] font-semibold tracking-[0.13em] text-[#5B6B82]">
        Phone alerts
      </p>

      {state === "needs-install" && (
        <p className="mt-1.5 text-[16px] font-medium leading-snug text-[#6B7A90]">
          Add Able OS to your Home Screen first — tap Share, then Add to Home
          Screen. Alerts can&apos;t work from a Safari tab.
        </p>
      )}

      {state === "denied" && (
        <p className="mt-1.5 text-[16px] font-medium leading-snug text-[#D95717]">
          Blocked on this device. Turn notifications back on for Able OS in your
          phone&apos;s settings, then reopen the app.
        </p>
      )}

      {state === "default" && (
        <>
          <p className="mt-1.5 text-[16px] font-medium leading-snug text-[#6B7A90]">
            Get alerts on your lock screen, even when the app is closed.
          </p>
          <button
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#418BFF] px-3 py-2.5 text-[16px] font-semibold tracking-wide text-white transition-colors hover:bg-[#2F6FD8] disabled:bg-[#CBD5E1] disabled:text-[#8A99AC]"
            disabled={busy}
            onClick={handleEnable}
            type="button"
          >
            {busy ? (
              <LoaderIcon
                className="animate-spin"
                size={13}
                strokeWidth={2.5}
              />
            ) : (
              <BellRingIcon size={13} strokeWidth={2.5} />
            )}
            Turn on
          </button>
        </>
      )}

      {state === "granted" && (
        <>
          <p className="mt-1.5 flex items-center gap-1.5 text-[16px] font-medium text-[#16A34A]">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-[#16A34A]"
            />
            On for this device
          </p>
          <button
            className="mt-2 w-full rounded-xl border border-[#DCE4EE] px-3 py-2 text-[16px] font-semibold tracking-wide text-[#526176] transition-colors hover:bg-[#F1F5F9] disabled:opacity-60"
            disabled={busy}
            onClick={handleDisable}
            type="button"
          >
            Turn off
          </button>
        </>
      )}

      {error && (
        <p className="mt-2 text-[16px] font-medium text-red-500">{error}</p>
      )}
    </div>
  );
}
