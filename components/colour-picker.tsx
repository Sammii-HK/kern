"use client";

interface ColourPickerProps {
  textColour: string;
  bgColour: string;
  onTextChange: (colour: string) => void;
  onBgChange: (colour: string) => void;
}

export function ColourPicker({
  textColour,
  bgColour,
  onTextChange,
  onBgChange,
}: ColourPickerProps) {
  return (
    <div className="flex items-center gap-4">
      <label className="flex items-center gap-2 text-xs text-muted">
        <span>Text</span>
        <input
          type="color"
          value={textColour}
          onChange={(e) => onTextChange(e.target.value)}
          className="w-6 h-6 rounded border border-border cursor-pointer"
        />
      </label>
      <label className="flex items-center gap-2 text-xs text-muted">
        <span>Background</span>
        <input
          type="color"
          value={bgColour}
          onChange={(e) => onBgChange(e.target.value)}
          className="w-6 h-6 rounded border border-border cursor-pointer"
        />
      </label>
    </div>
  );
}
