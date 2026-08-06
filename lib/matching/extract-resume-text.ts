/**
 * Best-effort extraction of searchable text from uploaded resume files.
 * Used at upload time so matching stays cheap (no per-page PDF re-parse).
 */

const MAX_CHARS = 24_000;

function cleanExtracted(text: string): string {
  return text
    .replace(/\u0000/g, " ")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_CHARS);
}

function isTextLike(fileName: string, mime: string): boolean {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".txt") || lower.endsWith(".md") || lower.endsWith(".csv")) {
    return true;
  }
  return (
    mime.startsWith("text/") ||
    mime === "application/json" ||
    mime === "application/xml"
  );
}

function isPdf(fileName: string, mime: string): boolean {
  return (
    fileName.toLowerCase().endsWith(".pdf") ||
    mime === "application/pdf"
  );
}

function isDocx(fileName: string, mime: string): boolean {
  const lower = fileName.toLowerCase();
  return (
    lower.endsWith(".docx") ||
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
}

/** Very light DOCX text pull: document.xml text nodes (no external zip dep). */
function extractDocxRough(bytes: Uint8Array): string {
  // DOCX is a zip; find word/document.xml payload after local file header.
  const asStr = Buffer.from(bytes).toString("binary");
  const marker = "word/document.xml";
  const idx = asStr.indexOf(marker);
  if (idx < 0) return "";
  // Local file header is 30 bytes; file name length at offset 26; extra at 28.
  // Scan for XML start after the marker region.
  const xmlStart = asStr.indexOf("<?xml", idx);
  if (xmlStart < 0) {
    // Compressed payload — skip when not store-compressed
    return "";
  }
  const xmlEnd = asStr.indexOf("</w:document>", xmlStart);
  const xml =
    xmlEnd > xmlStart
      ? asStr.slice(xmlStart, xmlEnd + "</w:document>".length)
      : asStr.slice(xmlStart, xmlStart + 500_000);
  // Prefer w:t text runs; fall back to stripping tags.
  const runs = [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]);
  if (runs.length > 0) return runs.join(" ");
  return xml
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/**
 * Extract plain text from resume file bytes.
 * Returns empty string on failure (matching still works via other fields).
 */
export async function extractResumeText(
  bytes: Uint8Array,
  fileName: string,
  mimeType = "",
): Promise<string> {
  try {
    if (bytes.length === 0) return "";
    const mime = mimeType || "application/octet-stream";

    if (isTextLike(fileName, mime)) {
      return cleanExtracted(new TextDecoder("utf-8", { fatal: false }).decode(bytes));
    }

    if (isPdf(fileName, mime)) {
      try {
        const { extractText, getDocumentProxy } = await import("unpdf");
        const pdf = await getDocumentProxy(bytes);
        const result = await extractText(pdf, { mergePages: true });
        const raw = result.text as unknown;
        const text =
          typeof raw === "string"
            ? raw
            : Array.isArray(raw)
              ? raw.map(String).join("\n")
              : "";
        return cleanExtracted(text);
      } catch (err) {
        console.error("resume pdf extract", err);
        return "";
      }
    }

    if (isDocx(fileName, mime)) {
      return cleanExtracted(extractDocxRough(bytes));
    }

    // Last resort: if mostly printable ASCII, keep it
    const decoded = new TextDecoder("utf-8", { fatal: false }).decode(
      bytes.slice(0, 100_000),
    );
    const printable = decoded.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
    if (printable.length > 200 && printable.length / decoded.length > 0.6) {
      return cleanExtracted(printable);
    }
    return "";
  } catch (err) {
    console.error("extractResumeText", err);
    return "";
  }
}
