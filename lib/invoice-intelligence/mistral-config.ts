// Validated, versioned IDs. Do not let a stale deployment setting reintroduce
// a floating alias (or OCR 4.0, retired on 30 September 2026).
export const PINNED_OCR_MODEL = "mistral-ocr-4-1";
export const PINNED_CHAT_MODEL = "mistral-small-2603";

export function mistralOcrModel() {
  const value = process.env.MISTRAL_OCR_MODEL?.trim();
  return !value || ["mistral-ocr-latest", "mistral-ocr-4", "mistral-ocr-4-0"].includes(value) ? PINNED_OCR_MODEL : value;
}

export function mistralChatModel(kind: "classifier" | "extract") {
  const value = process.env[kind === "classifier" ? "MISTRAL_BULK_CLASSIFIER_MODEL" : "MISTRAL_BULK_EXTRACT_MODEL"]?.trim();
  return !value || value === "mistral-small-latest" ? PINNED_CHAT_MODEL : value;
}
