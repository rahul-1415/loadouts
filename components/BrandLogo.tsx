import Image from "next/image";

type LogoVariant = "icon" | "wordmark" | "lockup";
type LogoSize = "sm" | "md" | "lg";

interface BrandLogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  className?: string;
  priority?: boolean;
  ariaLabel?: string;
}

const iconBySize: Record<LogoSize, number> = { sm: 24, md: 32, lg: 40 };

const wordmarkClassBySize: Record<LogoSize, string> = {
  sm: "text-[11px] tracking-[0.34em]",
  md: "text-[13px] tracking-[0.35em]",
  lg: "text-[15px] tracking-[0.36em]",
};

const lockupGapBySize: Record<LogoSize, string> = {
  sm: "gap-2",
  md: "gap-2.5",
  lg: "gap-3",
};

const wordmarkFont =
  'Maple, "Founders Grotesk", "Monotype Grotesque", ui-sans-serif, system-ui, sans-serif';

export default function BrandLogo({
  variant = "lockup",
  size = "md",
  className,
  priority = false,
  ariaLabel,
}: BrandLogoProps) {
  if (variant === "icon") {
    const iconSize = iconBySize[size];

    return (
      <Image
        src="/brand/loadouts-icon.svg"
        alt={ariaLabel ?? ""}
        aria-hidden={ariaLabel ? undefined : true}
        width={iconSize}
        height={iconSize}
        priority={priority}
        className={["brand-mark", className].filter(Boolean).join(" ")}
      />
    );
  }

  if (variant === "wordmark") {
    return (
      <span
        aria-label={ariaLabel}
        aria-hidden={ariaLabel ? undefined : true}
        className={[
          "brand-wordmark inline-flex items-center font-semibold uppercase leading-none text-[#f4f5f7]",
          wordmarkClassBySize[size],
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ fontFamily: wordmarkFont }}
      >
        LOADOUTS
      </span>
    );
  }

  const iconSize = iconBySize[size];

  return (
    <span
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      className={[
        "inline-flex items-center",
        lockupGapBySize[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Image
        src="/brand/loadouts-icon.svg"
        alt=""
        aria-hidden
        width={iconSize}
        height={iconSize}
        priority={priority}
        className="brand-mark shrink-0"
      />
      <span
        className={[
          "brand-wordmark inline-flex items-center font-semibold uppercase leading-none text-[#f4f5f7]",
          wordmarkClassBySize[size],
        ].join(" ")}
        style={{ fontFamily: wordmarkFont }}
      >
        LOADOUTS
      </span>
    </span>
  );
}
