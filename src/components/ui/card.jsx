// src/components/ui/card.jsx

export function Card({ children, className = "", ...rest }) {
  return (
    <div
      className={
        "border rounded-lg shadow-sm bg-white p-4 " + className
      }
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className = "", ...rest }) {
  return (
    <div className={"mt-2 " + className} {...rest}>
      {children}
    </div>
  );
}
