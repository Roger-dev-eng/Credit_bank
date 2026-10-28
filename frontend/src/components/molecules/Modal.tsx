import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "../atoms/Button";
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-heading">
        <h2>{title}</h2>
        <Button variant="outline" aria-label="Fechar" onClick={onClose}>
          ×
        </Button>
      </div>
      {children}
    </dialog>
  );
}
