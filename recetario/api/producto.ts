// Función de Vercel (plan gratis): GET /api/producto?codigo=7730205033047  (&diagnostico=1 para ver cada fuente)
import { buscarProductoConDiagnostico } from '../src/servidor/buscarProducto'

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const codigo = url.searchParams.get('codigo') ?? ''
  if (!/^\d{8,14}$/.test(codigo)) {
    return Response.json({ error: 'Código inválido' }, { status: 400 })
  }
  const { resultados, fuentes } = await buscarProductoConDiagnostico(codigo)
  const diagnostico = url.searchParams.has('diagnostico')
  return Response.json(
    diagnostico ? { resultados, fuentes } : { resultados },
    // Se guarda un día en la red de Vercel: el mismo código no vuelve a consultar las fuentes.
    { headers: { 'Cache-Control': diagnostico ? 'no-store' : 'public, s-maxage=86400, stale-while-revalidate=604800' } },
  )
}
