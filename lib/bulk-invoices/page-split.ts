export function splitPdfFilename(sourceFilename: string, groupIndex: number) {
  const base = sourceFilename.replace(/\.pdf$/i, "").slice(0, 180) || "racun";
  return `${base}-racun-${String(groupIndex + 1).padStart(3, "0")}.pdf`;
}
