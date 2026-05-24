type DateInput = Date | string | number | null | undefined;

type DateTimeDisplayStyle = "dash" | "cn";

type FormatDateTimeOptions = {
  timeZone?: string;
  style?: DateTimeDisplayStyle;
};

const DEFAULT_TIME_ZONE = "Asia/Shanghai";

function parseDate(value: DateInput): Date | null {
  if (value === null || value === undefined) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function getDateTimeParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const values = formatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});

  return {
    year: values.year || "0000",
    month: values.month || "00",
    day: values.day || "00",
    hour: values.hour || "00",
    minute: values.minute || "00",
  };
}

export function formatDateTime(
  value: DateInput,
  options: FormatDateTimeOptions = {},
): string {
  const date = parseDate(value);
  if (!date) {
    return "";
  }

  const timeZone = options.timeZone || DEFAULT_TIME_ZONE;
  const style = options.style || "dash";
  const parts = getDateTimeParts(date, timeZone);

  if (style === "cn") {
    return `${parts.year}\u5e74${parts.month}\u6708${parts.day}\u65e5 ${parts.hour}:${parts.minute}`;
  }

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}
