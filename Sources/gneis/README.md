# Visualizador GNEIS

App Next.js del visor de mapas (API-IDEE + catálogo STAC).

## Docker (producción)

La configuración de URLs va en los Dockerfiles (defaults). No hace falta pasar todos los `--build-arg`.

| Entorno | Dockerfile | Portal por defecto |
|---------|------------|--------------------|
| CNIG / cliente | `Dockerfile.cnig` | `http://10.67.33.172:8180` |



### CNIG (con proxy)

```bash
docker build -f Dockerfile.cnig \
  --build-arg HTTP_PROXY=$HTTP_PROXY \
  --build-arg HTTPS_PROXY=$HTTPS_PROXY \
  --build-arg NO_PROXY=$NO_PROXY \
  -t gneis-front-visualizador:prod \
  .

docker run -d --name gneis-visualizador --restart unless-stopped \
  -p 8280:8280 gneis-front-visualizador:prod
```

Más detalle: [comandos.md](./comandos.md).

Puerto del contenedor: **8280**. App en `/gneis`.

## Desarrollo local

```bash
npm install
npm run dev
```

Usa `.env.local` (solo local; no entra en la imagen Docker).

## Variables (build-time)

- `NEXT_PUBLIC_API_IDEE_URL` / `NEXT_PUBLIC_API_IDEE_PLUGINS_URL`
- `NEXT_PUBLIC_GNEIS_PORTAL_URL`
- `NEXT_PUBLIC_GNEIS_STAC_URL`
- `NEXT_PUBLIC_GNEIS_DOWNLOAD_URL`
- `NEXT_PUBLIC_ASSET_VERSION` — cache-buster de CSS/JS API-IDEE (`?v=`)
- `PAGE_TITLE`
