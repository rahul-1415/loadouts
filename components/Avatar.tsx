interface AvatarProps {
  alt: string;
  size?: "sm" | "md" | "lg";
}

const sizeStyles = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
};

export default function Avatar({ alt, size = "md" }: AvatarProps) {
  return (
    <div
      aria-label={alt}
      className={`${sizeStyles[size]} rounded-full bg-slate-200`}
    />
  );
}
