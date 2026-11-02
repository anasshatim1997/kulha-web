"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastTone = "success" | "error" | "info";
type ToastItem = { id: number; tone: ToastTone; title: string; description?: string };
type ToastInput = { title: string; description?: string; duration?: number };
type ToastApi = {
  success: (input: ToastInput) => void;
  error: (input: ToastInput) => void;
  info: (input: ToastInput) => void;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const push = useCallback((tone: ToastTone, input: ToastInput) => {
    const id = nextId.current++;
    setItems((current) => [...current.slice(-3), { id, tone, title: input.title, description: input.description }]);
    const timer = setTimeout(() => dismiss(id), input.duration ?? (tone === "error" ? 6500 : 4500));
    timers.current.set(id, timer);
  }, [dismiss]);

  useEffect(() => () => {
    for (const timer of timers.current.values()) clearTimeout(timer);
    timers.current.clear();
  }, []);

  const value: ToastApi = {
    success: (input) => push("success", input),
    error: (input) => push("error", input),
    info: (input) => push("info", input),
    dismiss,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="kulha-toast-viewport" aria-label="Notifications">
        {items.map((item) => (
          <section
            key={item.id}
            className={`kulha-toast kulha-toast-${item.tone}`}
            role={item.tone === "error" ? "alert" : "status"}
            aria-live={item.tone === "error" ? "assertive" : "polite"}
          >
            <span className="kulha-toast-mark" aria-hidden="true">
              {item.tone === "success" ? "✓" : item.tone === "error" ? "!" : "i"}
            </span>
            <div className="kulha-toast-copy">
              <strong>{item.title}</strong>
              {item.description && <p>{item.description}</p>}
            </div>
            <button type="button" className="kulha-toast-dismiss" onClick={() => dismiss(item.id)} aria-label="Dismiss notification">×</button>
          </section>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast must be used inside ToastProvider");
  return value;
}
