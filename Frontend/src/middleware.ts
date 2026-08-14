import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('sb-access-token')?.value
  const { pathname } = request.nextUrl

  // Redireciona tentativas de acessar rotas descontinuadas (/cadastro ou /feed)
  if (pathname === '/cadastro' || pathname === '/feed') {
    const targetUrl = new URL(token ? '/radar' : '/login', request.url)
    return NextResponse.redirect(targetUrl)
  }

  // Rotas públicas que não requerem autenticação
  const isPublicRoute = pathname === '/' || pathname === '/login'

  // Se o usuário está tentando acessar uma rota interna (privada) e não tem token
  if (!token && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Se o usuário já tem token e tenta acessar login ou a landing page, redireciona para o radar
  if (token && isPublicRoute) {
    const radarUrl = new URL('/radar', request.url)
    return NextResponse.redirect(radarUrl)
  }

  return NextResponse.next()
}

// Configura o middleware para rodar apenas nas páginas da aplicação
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (logo.png, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logo.png|logo_rocket.png|logo_text.png|file.svg|globe.svg|next.svg|vercel.svg|window.svg).*)',
  ],
}
