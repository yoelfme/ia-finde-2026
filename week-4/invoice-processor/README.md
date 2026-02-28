# Invoice Processor - Digitalización de Facturas con IA

Aplicación para digitalizar facturas utilizando IA (OpenAI GPT-5). Acepta imágenes PNG/JPG y PDF, extrae los datos estructurados y permite exportar reportes en PDF.

## Estructura del proyecto (Monorepo con Turbo)

- **apps/web** - Next.js 15, React, Tailwind CSS
- **apps/api** - Hono.js, LangChain, OpenAI, SQLite (Drizzle ORM)
- **packages/shared** - Esquemas Zod y tipos compartidos

## Requisitos previos

- Node.js 18+
- pnpm
- OpenAI API Key

Para procesar PDFs se usa `@hyzyla/pdfium` con `sharp`. Sharp incluye binarios precompilados para las plataformas más comunes.

## Configuración

1. Copiar `.env.example` a `.env` y agregar tu API Key de OpenAI:

```
OPENAI_API_KEY=sk-tu-api-key-aqui
```

2. Instalar dependencias:

```bash
pnpm install
```

3. Crear la base de datos SQLite:

```bash
pnpm db:push
```

## Desarrollo

Ejecutar ambos servicios (web en puerto 3000, API en puerto 3001):

```bash
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:3001

## Build

```bash
pnpm build
```

## Uso

1. Abre http://localhost:3000
2. Arrastra o selecciona una factura (PNG, JPG o PDF)
3. La IA extraerá: proveedor, cliente, items, subtotal, IVA, total y fecha
4. Los resultados se guardan en SQLite y puedes exportarlos como PDF

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/invoices/upload` | Subir y procesar factura |
| GET | `/invoices` | Listar facturas |
| GET | `/invoices/:id` | Detalle de factura |
| GET | `/invoices/:id/pdf` | Descargar reporte PDF |
| GET | `/uploads/:filename` | Archivo original |

Solo se aceptan PNG, JPG y PDF. Cualquier otro tipo retorna 400.
