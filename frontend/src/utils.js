export const money = (value) =>
  new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 2 }).format(
    Number(value || 0),
  );
export const date = (value) =>
  value
    ? new Intl.DateTimeFormat("uz-UZ", { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "—";
export const roles = {
  BUYER: "Xaridor",
  FACTORY: "Ishlab chiqaruvchi",
  DRIVER: "Haydovchi",
};
export function exportCSV(rows, filename) {
  if (!rows.length) return;
  const keys = [
    "product_name",
    "quantity",
    "unit_price",
    "total_amount",
    "status",
    "created_at",
  ];
  const cell = (value) => {
    let text = String(value ?? "");
    if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  const blob = new Blob(
    [
      "\uFEFF" +
        [
          keys.map(cell).join(","),
          ...rows.map((row) => keys.map((k) => cell(row[k])).join(",")),
        ].join("\r\n"),
    ],
    { type: "text/csv;charset=utf-8" },
  );
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename + ".csv";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
