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
    "border border-white/10 bg-[#f4f5f7] text-[#0b0c0f] hover:text-[#0b0c0f] focus-visible:ring-white/60",
  secondary:
    "border border-white/25 bg-transparent text-[#f4f5f7] hover:border-white/45 focus-visible:ring-white/35",
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
    variant === "primary" ? "bg-[#d7dadf]/85" : "bg-white/10";
  const label =
    variant === "primary"
      ? "text-[#0b0c0f] group-hover:text-[#0b0c0f]"
      : "text-[#f4f5f7]";

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
