import { cloneElement, isValidElement } from "react";
import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ControlProps = {
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

export type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
};

export function Field({
  id,
  label,
  hint,
  error,
  className,
  children,
}: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ");

  const control = isValidElement<ControlProps>(children)
    ? cloneElement(children, {
        "aria-describedby": describedBy || undefined,
        "aria-invalid": error ? true : undefined,
      })
    : children;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      {control}
      {hint ? (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
