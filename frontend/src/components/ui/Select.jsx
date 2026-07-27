export function Select({
  label,
  options,
  name,
  value,
  onChange,
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-2">
        {label}
      </label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full h-12 px-4 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select</option>

        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}
