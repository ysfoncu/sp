// A date picked in the browser is midnight local time. `toISOString()` turns it into UTC,
// which is the day before east of Greenwich, so a date picked as the 22nd was saved as the 21st.
// This keeps the day the user picked.
export const localIsoDate = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
