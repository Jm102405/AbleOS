import React from "react";
import { Navigate } from "react-router-dom";
import { LoaderIcon } from "lucide-react";
import { useAuth, type CockpitKey } from "../lib/AuthProvider";

/** Shown while the stored session is being restored. */
function AuthLoading() {
  return (
    <div className="grid min-h-screen w-full place-items-center bg-[#EEF2F6]">
      <div className="flex items-center gap-3">
        <LoaderIcon
          className="animate-spin text-[#418BFF]"
          size={18}
          strokeWidth={2.5}
        />
        <span className="text-[12px] font-bold text-[#5B6B82]">
          Loading Able OS…
        </span>
      </div>
    </div>
  );
}

/** Signed in, but no row in profiles — account exists without a cockpit. */
function NoProfile() {
  const { signOut } = useAuth();

  return (
    <div className="grid min-h-screen w-full place-items-center bg-[#EEF2F6] px-5">
      <div className="w-full max-w-sm rounded-2xl border border-[#DCE4EE] bg-white p-6 text-center shadow-[0_8px_20px_rgba(30,58,138,0.08)]">
        <h1 className="text-[16px] font-extrabold tracking-[-0.025em] text-[#1A1A2E]">
          No cockpit assigned
        </h1>
        <p className="mt-2 text-[12px] font-medium leading-relaxed text-[#6B7A90]">
          Your account exists but isn&apos;t linked to a dashboard yet. Ask Dane
          to add you to the profiles table.
        </p>
        <button
          className="mt-5 w-full rounded-xl border border-[#DCE4EE] px-4 py-2.5 text-[12px] font-extrabold uppercase tracking-wide text-[#526176] transition-colors hover:bg-[#F1F5F9]"
          onClick={signOut}
          type="button"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

type ProtectedRouteProps = {
  cockpit: CockpitKey;
  children: React.ReactNode;
};

export function ProtectedRoute({ cockpit, children }: ProtectedRouteProps) {
  const { session, profile, loading } = useAuth();

  if (loading) return <AuthLoading />;
  if (!session) return <Navigate replace to="/login" />;
  if (!profile) return <NoProfile />;

  // Signed in, but trying to reach someone else's cockpit — send them home.
  if (profile.cockpit !== cockpit) {
    return <Navigate replace to={`/${profile.cockpit}`} />;
  }

  return <>{children}</>;
}

/** Sends "/" to whichever cockpit the signed-in user owns. */
export function HomeRedirect() {
  const { session, profile, loading } = useAuth();

  if (loading) return <AuthLoading />;
  if (!session) return <Navigate replace to="/login" />;
  if (!profile) return <NoProfile />;

  return <Navigate replace to={`/${profile.cockpit}`} />;
}
