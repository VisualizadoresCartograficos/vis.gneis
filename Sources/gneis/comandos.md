# Visualizador GNEIS — comandos Docker
#
# Fuente de verdad de URLs: defaults en Dockerfile.prod / Dockerfile.cnig.
# Solo hace falta --build-arg para proxy (CNIG) o para subir NEXT_PUBLIC_ASSET_VERSION.

---

## CNIG / cliente (intranet)

Defaults: portal `http://10.67.33.172:8180`. Pasar proxy del build.

```bash
export HTTP_PROXY=http://192.168.192.11:8080
export HTTPS_PROXY=http://192.168.192.11:8080
export NO_PROXY=localhost,127.0.0.1,.cnig.local,.cnig.es

docker build -f Dockerfile.cnig \
  --build-arg HTTP_PROXY=$HTTP_PROXY \
  --build-arg HTTPS_PROXY=$HTTPS_PROXY \
  --build-arg NO_PROXY=$NO_PROXY \
  -t gneis-front-visualizador:prod \
  .

docker stop gneis-visualizador 2>/dev/null; docker rm gneis-visualizador 2>/dev/null

docker run -d \
  --name gneis-visualizador \
  --restart unless-stopped \
  -p 8280:8280 \
  gneis-front-visualizador:prod
```

URL: `http://<host>:8280/gneis`  
Embed sin cabecera: `?includeHeader=false`

---

## Proxy Docker en CNIG (una vez)

```bash
sudo mkdir -p /etc/systemd/system/docker.service.d
# http-proxy.conf con HTTP_PROXY / HTTPS_PROXY / NO_PROXY
sudo systemctl daemon-reload
sudo systemctl restart docker
```

---

## Notas

- Las `NEXT_PUBLIC_*` se incrustan en el **build**; `docker run -e` no las cambia.
- `.env.local` solo aplica a `npm run dev` en local, no al `docker build`.
- En `setenv.sh` de Tomcat, Liferay permite embeber iframes.
