const formatValue = (value: unknown) => {
  if (value === null || value === undefined) return "";

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "object" && item !== null) {
          return Object.entries(item)
            .map(([key, val]) => {
              if (typeof val === "object" && val !== null) {
                return `${key}: ${JSON.stringify(val)}`;
              }

              return `${key}: ${val}`;
            })
            .join(" - ");
        }

        return String(item);
      })
      .join(" | ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
};

const exportToCSV = <T extends object>(data: T[], filename: string) => {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);

  const rowDatas = [
    headers.join(","),

    ...data.map((rowDt) =>
      headers
        .map((header) => {
          const value = formatValue((rowDt as Record<string, unknown>)[header]);
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(","),
    ),
  ];

  const content = "\uFEFF" + rowDatas.join("\n");

  const blob = new Blob([content], {
    type: "text/csv;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
};

export default exportToCSV;
