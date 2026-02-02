import React from "react";
import Link from "next/link";

type ButtonVariant = "primary" | "secondary";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

interface ButtonLinkProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Link>, "className"> {
  variant?: ButtonVariant;
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "border border-ink bg-ink text-paper hover:text-ink focus-visible:ring-accent-yellow",
  secondary:
    "border border-ink/30 bg-transparent text-ink hover:border-ink focus-visible:ring-ink/30",
};

const baseClasses =
  "group relative inline-flex items-center justify-center overflow-hidden rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition focus-visible:outline-none focus-visible:ring-2";

function ButtonInner({
  variant,
  children,
}: {
  variant: ButtonVariant;
  children: React.ReactNode;
}) {
  const overlay =
    variant === "primary" ? "bg-accent-yellow/90" : "bg-ink/10";
  const label =
    variant === "primary"
      ? "text-paper group-hover:text-ink"
      : "text-ink";

  return (
    <>
      <span
        className={`absolute inset-0 -z-10 translate-y-full transition duration-300 ease-out group-hover:translate-y-0 ${overlay}`}
      />
      <span className={`relative transition duration-300 ${label}`}>
        {children}
      </span>
    </>
  );
}

export default function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${baseClasses} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      <ButtonInner variant={variant}>{children}</ButtonInner>
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={`${baseClasses} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      <ButtonInner variant={variant}>{children}</ButtonInner>
    </Link>
  );
}
