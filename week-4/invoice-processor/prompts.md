# Initial Prompt

Crearemos una aplicacion para digitalizar facturas utilizando IA. Debemos tener una pequeña web, donde el usuario podria recibir:

- Imagenes (PNG o JPG)
- PDF

Cualquier otro tipo de archivo debería de responder con un 400 status code, que diga que no se puede procesar.

Los resultados del procesamiento se deberían de poder exportar en un pequeño PDF.

Utilizaremos SQLite como base de datos, tendremos solo un esquema done guardaremos los resultados del procesamiento. Los archivos los guardaremos localmente para que se pueda hacer referencia a ellos despues al momento de visualizar un reporte.

El proyecto lo divideremos en 2 partes, sería un monorepo utilizando Turbo:

- La web (Next.js, React, Tailwind)
- API (Langchain, TypeScript, OpenAI)


Utilizaremos un modelo de OpenAI, yo voy a proveer el API Key

La salida del API deberia de darme el siguiente formato por cada factura que se procese:

- producer (el que emite la factura, proveedor): NIT, name
- consumer (el que recibe la factura, cliente): NIT, name
- items (por cada item): quantity, description, price, subtotal
- subtotal
- taxes (IVA en Guatemala)
- total
- date (fecha de emision)