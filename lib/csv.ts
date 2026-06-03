export function escapeCsvCell(value: string | number | boolean | null | undefined) {
  const text = value == null ? "" : String(value);
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

export function toCsv(rows: Array<Record<string, string | number | boolean | null | undefined>>) {
  if (!rows.length) return "";

  const headers = rows.reduce<string[]>((keys, row) => {
    for (const key of Object.keys(row)) {
      if (!keys.includes(key)) keys.push(key);
    }

    return keys;
  }, []);
  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => headers.map((header) => escapeCsvCell(row[header])).join(","))
  ];

  return lines.join("\n");
}
