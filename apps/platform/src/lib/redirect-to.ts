/**
 * Redirects the current browser window to the specified URL.
 *
 * @param url - The destination URL to redirect to.
 */
export function redirectTo(url: string) {
	window.location.href = url
}