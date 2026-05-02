import { useState, useRef, useEffect } from "react";

interface Props {
  label: string;
  value: number;
  formatValue: (n: number) => string;
  onSave: (value: number) => Promise<void>;
  highlight?: boolean;
  editable?: boolean;
}

export default function EditableStatCard({ label, value, formatValue, onSave, highlight, editable = true }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSave = async () => {
    const num = Number(draft);
    if (isNaN(num) || num < 0) {
      setDraft(String(value));
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(num);
      setEditing(false);
    } catch {
      setDraft(String(value));
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") { setDraft(String(value)); setEditing(false); }
  };

  return (
    <div
      className={`stat-card ${highlight ? "highlight" : ""} ${editable ? "editable" : ""}`}
      onClick={() => { if (editable && !editing) { setDraft(String(value)); setEditing(true); } }}
    >
      <span className="label">{label}{editable && !editing && <span className="edit-icon"> ✎</span>}</span>
      {editing ? (
        <div className="stat-edit">
          <input
            ref={inputRef}
            type="number"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            disabled={saving}
            className="stat-input"
          />
        </div>
      ) : (
        <span className="value">{formatValue(value)}</span>
      )}
    </div>
  );
}
