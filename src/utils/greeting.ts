/** Greeting that depends on the time of day. */
export function getGreeting(date: Date, userName: string, byTime: boolean): string {
  let base = 'Hello';
  if (byTime) {
    const h = date.getHours();
    if (h < 5) base = 'Good night';
    else if (h < 12) base = 'Good morning';
    else if (h < 18) base = 'Good afternoon';
    else base = 'Good evening';
  }
  const name = userName.trim();
  return name ? `${base}, ${name}!` : `${base}!`;
}
