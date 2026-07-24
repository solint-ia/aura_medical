"use client";

import type { ReactNode } from "react";

import { useAccreditation } from "./AccreditationProvider";

interface AccreditationButtonProps {
  children: ReactNode;
  className?: string;
  /** Pre-fills the protocol of interest in the form. */
  protocolName?: string;
  onActivate?: () => void;
}

/**
 * Opens the accreditation form. Lets server-rendered sections keep a lead CTA
 * without becoming client components themselves.
 */
export function AccreditationButton({
  children,
  className = "",
  protocolName,
  onActivate,
}: AccreditationButtonProps) {
  const { open } = useAccreditation();

  return (
    <button
      type="button"
      onClick={() => {
        onActivate?.();
        open(protocolName);
      }}
      className={className}
    >
      {children}
    </button>
  );
}
