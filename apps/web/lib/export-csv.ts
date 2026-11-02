export function exportToCsv(
  filename: string,
  headers: Record<string, string>, // { key: "Display Label" }
  rows: Record<string, unknown>[]
): void {
  const keys = Object.keys(headers);
  const headerLabels = keys.map((k) => `"${String(headers[k]).replace(/"/g, '""')}"`).join(",");

  const csvRows = rows.map((row) => {
    return keys
      .map((key) => {
        const raw = row[key];
        let val = "";
        if (raw === null || raw === undefined) {
          val = "";
        } else if (raw instanceof Date) {
          val = raw.toISOString();
        } else if (typeof raw === "object") {
          val = JSON.stringify(raw);
        } else {
          val = String(raw);
        }
        return `"${val.replace(/"/g, '""')}"`;
      })
      .join(",");
  });

  const csvContent = "\uFEFF" + [headerLabels, ...csvRows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
