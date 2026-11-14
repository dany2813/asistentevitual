import { useState, type ChangeEvent } from "react";
import { AvatarDisplay, isImageAvatar } from "./AvatarDisplay";

interface AvatarPickerProps {
  value: string;
  onChange: (value: string) => void;
  quickEmojis?: string[];
  defaultEmoji?: string;
}

const DEFAULT_EMOJIS = ["🤖", "💻", "🧠", "🎓", "⚖️", "🎨", "📈", "🩺", "✍️", "🚀"];

export function AvatarPicker({
  value,
  onChange,
  quickEmojis = DEFAULT_EMOJIS,
  defaultEmoji = "🤖",
}: AvatarPickerProps) {
  const initialMode = isImageAvatar(value)
    ? value.startsWith("data:image/")
      ? "file"
      : "url"
    : "emoji";

  const [mode, setMode] = useState<"emoji" | "url" | "file">(initialMode);
  const [fileError, setFileError] = useState("");

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setFileError("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setFileError("La imagen debe pesar menos de 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col sm:flex-row items-start gap-4 p-4 rounded-xl border border-[#DBDBDB] bg-white">
      <div className="flex flex-col items-center gap-1.5 shrink-0">
        <AvatarDisplay avatar={value || defaultEmoji} size="xl" fallback={defaultEmoji} />
        <span className="text-[11px] text-[#6B6B6B]">Vista previa</span>
      </div>

      <div className="flex-1 w-full min-w-0">
        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#F3F5F8] border border-[#E7E9EE] mb-3">
          {(
            [
              { id: "emoji", label: "Emoji" },
              { id: "url", label: "URL de imagen" },
              { id: "file", label: "Subir archivo" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMode(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                mode === tab.id
                  ? "bg-white text-[#1A1D24] shadow-xs border border-[#DBDBDB]"
                  : "text-[#6B6B6B] hover:text-[#1A1D24]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {mode === "emoji" && (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={isImageAvatar(value) ? defaultEmoji : value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={defaultEmoji}
                maxLength={8}
                className="w-16 h-10 text-center text-lg rounded-lg border border-[#DBDBDB] bg-white text-[#1A1D24] focus:border-[#5099D6]"
              />
              <div className="flex flex-wrap gap-1.5">
                {quickEmojis.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => onChange(em)}
                    className={`w-9 h-9 rounded-lg border text-base flex items-center justify-center transition-colors cursor-pointer ${
                      value === em
                        ? "border-[#5099D6] bg-[#5099D6]/10"
                        : "border-[#E7E9EE] hover:border-[#76A4F9] bg-white"
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {mode === "url" && (
          <div className="space-y-1.5">
            <input
              type="url"
              value={isImageAvatar(value) && !value.startsWith("data:") ? value : ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://ejemplo.com/avatar.png"
              className="w-full h-10 px-3 text-sm rounded-lg border border-[#DBDBDB] bg-white text-[#1A1D24] focus:border-[#5099D6]"
            />
            <p className="text-xs text-[#6B6B6B]">
              Pega el enlace directo a una imagen pública (PNG, JPG, WEBP o SVG).
            </p>
          </div>
        )}

        {mode === "file" && (
          <div className="space-y-1.5">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              onChange={handleFileChange}
              className="block w-full text-xs text-[#6B6B6B] file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border file:border-[#DBDBDB] file:text-xs file:font-medium file:bg-[#F3F5F8] file:text-[#1A1D24] hover:file:bg-[#E7E9EE] file:cursor-pointer"
            />
            {fileError && <p className="text-xs text-red-600">{fileError}</p>}
            <p className="text-xs text-[#6B6B6B]">
              Formatos aceptados: PNG, JPG, WEBP, SVG (máx. 2 MB).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
