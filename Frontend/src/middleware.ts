import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('sb-access-token')?.value
  const { pathname } = request.nextUrl

  // 1. Redireciona rotas descontinuadas
  if (pathname === '/cadastro' || pathname === '/feed') {
    return NextResponse.redirect(new URL(token ? '/radar' : '/login', request.url))
  }

  // 2. Define a rota pública (apenas /login)
  const isLoginPage = pathname === '/login'

  // 3. Se não tem token e não está na tela de login, manda para /login
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 4. Se já tem token e tenta acessar /login, manda para /radar
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/radar', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}