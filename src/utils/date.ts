import dayjs from "dayjs";

export function formatDate(date: Date | null, pattern: string = "YYMMDD-HHmmss") {
  if (date === null) return null;

  let formatted = `${pattern}`;

  const year = date.getFullYear();
  if (formatted.indexOf("YYYY") >= 0) {
    formatted = formatted.replace(
      "YYYY", 
      `${year}`.padStart(4, '0')
    );
  }
  if (formatted.indexOf("YY") >= 0) {
    formatted = formatted.replace(
      "YY",
      `${year % 100}`.padStart(2, '0')
    );
  }

  const month = date.getMonth() + 1;
  if (formatted.indexOf("MM") >= 0) {
    formatted = formatted.replace(
      "MM",
      `${month}`.padStart(2, '0')
    );
  }

  const day = date.getDate();
  if (formatted.indexOf("DD") >= 0) {
    formatted = formatted.replace(
      "DD",
      `${day}`.padStart(2, '0')
    );
  }

  const hour = date.getHours();
  if (formatted.indexOf("HH") >= 0) {
    formatted = formatted.replace(
      "HH",
      `${hour}`.padStart(2, '0')
    );
  }

  const minute = date.getMinutes();
  if (formatted.indexOf("mm") >= 0) {
    formatted = formatted.replace(
      "mm",
      `${minute}`.padStart(2, '0')
    );
  }

  const second = date.getSeconds();
  if (formatted.indexOf("ss") >= 0) {
    formatted = formatted.replace(
      "ss",
      `${second}`.padStart(2, '0')
    );
  }

  return formatted;
}

export function format(date: Date, pattern: string = "YYMMDD-HHmmss") {
  const day = dayjs(date);
  return day.format(pattern);
}
