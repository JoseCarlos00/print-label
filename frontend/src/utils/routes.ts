const PROTECTED_PATHS = ['/staging'];

export function isProtectedPath(pathname: string): boolean {
	return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}
