import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 클라이언트의 쿠키에서 로그인 완료 시 저장되는 'memora_session' 확인
  const isAuthenticated = request.cookies.has('memora_session');
  const path = request.nextUrl.pathname;

  // 비로그인 상태에서 보호된 라우트(대시보드, 강의, 학습, 분석) 접근 시 로그인 페이지로 강제 리다이렉션
  const protectedRoutes = ['/dashboard', '/courses', '/learn', '/analysis'];
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));

  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 로그인 상태에서 랜딩, 로그인, 회원가입 페이지 접근 시 대시보드로 리다이렉션
  const isAuthRoute = path === '/login' || path === '/signup' || path === '/';
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|images|favicon.ico).*)'],
};
