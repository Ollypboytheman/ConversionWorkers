export function Textarea({ className = '', ...props }) {
  return (
    <textarea
      {...props}
      className={`border border-gray-300 rounded px-3 py-2 w-full min-h-[120px] focus:outline-none focus:ring focus:ring-blue-500 ${className}`}
    />
  );
}
