"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { AccreditationModal } from "./AccreditationModal";

interface AccreditationContextValue {
  /** Opens the accreditation form, optionally pre-filling the protocol of interest. */
  open: (protocolName?: string) => void;
}

const AccreditationContext = createContext<AccreditationContextValue | null>(
  null,
);

export function useAccreditation(): AccreditationContextValue {
  const context = useContext(AccreditationContext);

  if (!context) {
    throw new Error(
      "useAccreditation must be used inside an <AccreditationProvider>",
    );
  }

  return context;
}

export function AccreditationProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [protocolName, setProtocolName] = useState<string | null>(null);

  const open = useCallback((selectedProtocol?: string) => {
    setProtocolName(selectedProtocol ?? null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo<AccreditationContextValue>(() => ({ open }), [open]);

  return (
    <AccreditationContext.Provider value={value}>
      {children}
      {isOpen ? (
        <AccreditationModal protocolName={protocolName} onClose={close} />
      ) : null}
    </AccreditationContext.Provider>
  );
}
