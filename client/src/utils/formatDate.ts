const dateTimeFormatter = new Intl.DateTimeFormat("uk-UA", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(value?: string | Date | null) {
  if (!value) {
    return "—";
  }

  return dateTimeFormatter.format(new Date(value));
}
