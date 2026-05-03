export function isFirefox(): boolean {
  // Check the user agent string for "Firefox"
  return typeof navigator !== "undefined" && /firefox/i.test(navigator.userAgent);
}
