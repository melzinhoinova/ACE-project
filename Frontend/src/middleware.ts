import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function isValidJwt(token: string): boolean {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return false
    // Decodifica o payload base64url
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const payloadJson = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    const payload = JSON.parse(payloadJson)

    // Verifica expiração se presente
    if (payload.exp && typeof payload.exp === 'number') {
      const now = Math.floor(Date.now() / 1000)
      if (now >= payload.exp) {
        return false // Token expirado
      }
    }

    return Boolean(payload.sub || payload.email)
  } catch {
    return false
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('sb-access-token')?.value
  const hasValidToken = Boolean(token && isValidJwt(token))
  const { pathname } = request.nextUrl

  // 1. Redireciona rotas descontinuadas
  if (pathname === '/cadastro' || pathname === '/feed') {
    return NextResponse.redirect(new URL(hasValidToken ? '/radar' : '/login', request.url))
  }

  // 2. Define a rota pública (apenas /login)
  const isLoginPage = pathname === '/login'

  // 3. Se não tem token válido e não está na tela de login, manda para /login e limpa cookie inválido
  if (!hasValidToken && !isLoginPage) {
    const redirectRes = NextResponse.redirect(new URL('/login', request.url))
    if (token) {
      redirectRes.cookies.delete('sb-access-token')
    }
    return redirectRes
  }

  // 4. Se já tem token válido e tenta acessar /login sem convite, manda para /radar
  const isInviteFlow = request.nextUrl.searchParams.has('invite')
  if (hasValidToken && isLoginPage && !isInviteFlow) {
    return NextResponse.redirect(new URL('/radar', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}