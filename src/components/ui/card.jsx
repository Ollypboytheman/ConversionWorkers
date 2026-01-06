// src/components/ui/card.jsx

export function Card({ children, className = "", ...rest }) {
  return (
    <div
      className={
        "rounded-lg border border-border bg-card text-card-foreground shadow-sm " +
        className
      }
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className = "", ...rest }) {
  return (
    <div className={"p-6 " + className} {...rest}>
      {children}
    </div>
  );
}
