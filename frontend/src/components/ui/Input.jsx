export function Input({
  label,
  placeholder,
  name,
  value,
  onChange,
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-2">
        {label}
      </label>

      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full h-12 px-4 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}