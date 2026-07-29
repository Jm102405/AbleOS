import React from "react";

type MobileScreenShellProps = {
  headerContent: React.ReactNode;
  children: React.ReactNode;
};

export function MobileScreenShell({
  headerContent,
  children,
}: MobileScreenShellProps) {
  return (
    <div className="min-h-screen w-full bg-[#EEF2F6] text-[#1A1A2E]">
      <header className="bg-gradient-to-r from-[#5EC5E8] to-[#3B82C4] text-white shadow-sm">
        <div className="mx-auto max-w-[428px] px-5 pb-8 pt-5 sm:max-w-2xl sm:px-8 sm:pb-10 sm:pt-6 lg:max-w-5xl lg:px-10 xl:max-w-6xl">
          {headerContent}
        </div>
      </header>
      <main className="mx-auto max-w-[428px] px-5 pb-10 sm:max-w-2xl sm:px-8 sm:pb-14 lg:max-w-5xl lg:px-10 xl:max-w-6xl">
        {children}
      </main>
    </div>
  );
}
