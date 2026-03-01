export function fmtDate(value: string | Date): string {
  const d = new Date(value);
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function fmtDateTime(value: string | Date): string {
  const d = new Date(value);
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = d.getFullYear();
  const raw   = d.getHours();
  const h     = raw % 12 || 12;
  const m     = String(d.getMinutes()).padStart(2, '0');
  const ampm  = raw < 12 ? 'AM' : 'PM';
  return `${day}/${month}/${year}, ${h}:${m} ${ampm}`;
}
