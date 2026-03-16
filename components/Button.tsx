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
    "border border-[#d4dd7f]/70 bg-[#e6ef92] text-[#111111] hover:border-[#e6ef92] hover:text-[#111111] focus-visible:ring-[#e6ef92]/55",
  secondary:
    "border border-white/[0.08] bg-[#181818] text-[#f5f5f5] hover:border-white/[0.16] hover:bg-[#202020] focus-visible:ring-white/25",
};

const baseClasses =
  "group relative inline-flex items-center justify-center overflow-hidden rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition focus-visible:outline-none focus-visible:ring-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

function ButtonInner({
  variant,
  children,
}: {
  variant: ButtonVariant;
  children: React.ReactNode;
}) {
  const overlay =
    variant === "primary" ? "bg-[#f2f7b8]" : "bg-[#262626]";
  const label =
    variant === "primary"
      ? "text-[#111111] group-hover:text-[#111111]"
      : "text-[#f5f5f5]";

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
