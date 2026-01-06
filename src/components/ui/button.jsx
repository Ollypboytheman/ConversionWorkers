// src/components/ui/button.jsx

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
  "disabled:opacity-50 disabled:pointer-events-none";

const variants = {
  primary:
    "bg-primary text-primary-foreground hover:opacity-90 active:opacity-90",
  secondary:
    "bg-secondary text-secondary-foreground hover:opacity-90 active:opacity-90",
  destructive:
    "bg-destructive text-destructive-foreground hover:opacity-90 active:opacity-90",
  ghost:
    "bg-transparent hover:bg-muted text-foreground hover:text-foreground",
};

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-6 text-base",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  const v = variants[variant] || variants.primary;
  const s = sizes[size] || sizes.md;

  return (
    <button className={`${base} ${v} ${s} ${className}`} {...props}>
      {children}
    </button>
  );
}
