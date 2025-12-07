export function Input({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring focus:ring-blue-500 ${className}`}
    />
  );
}
