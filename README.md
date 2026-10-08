# Running Coach web

Frontend actual: React, TypeScript, Vite y Tailwind. Las reglas de trabajo están en
[AGENTS.md](AGENTS.md) y el sistema visual observado en [DESIGN.md](DESIGN.md).
El contexto de producto quedará en `PRODUCT.md` tras confirmar la entrevista de
`init`; su borrador todavía no se trata como contexto acordado.

```sh
npm install
npm run dev
npm run lint
npm test
npm run build
```

## Impeccable en Codex

Se reutiliza la skill global en `~/.agents/skills/impeccable` (4.5.0 durante este
setup, motor 0.1.11). No se añade una copia local ni una dependencia npm.
Si falta, seguir la [instalación oficial](https://impeccable.style/tutorials/getting-started/)
para Codex con alcance global y reiniciar Codex.

El setup sigue [`init`](https://impeccable.style/docs/init/) para producto y
[`document`](https://impeccable.style/docs/document/) para registrar el diseño
existente. Son comandos de la skill en el chat, no subcomandos del ejecutable:

- `$impeccable init`: actualizar público, propósito y restricciones.
- `$impeccable document`: actualizar DESIGN.md y `.impeccable/design.json` desde
  el sistema existente; no implica rediseñarlo.
- `$impeccable hooks status` y `$impeccable doctor`: comprobar configuración.

`.codex/hooks.json` reutiliza el launcher global con `$HOME` en macOS/Linux.
Registra PostToolUse y Stop con los matchers y tiempos del manifiesto instalado.
Si falta la skill, el hook no se ejecuta. El manifiesto de esta PR se verifica en
macOS; para Windows, regenerarlo con el instalador oficial de ese entorno.

Abrir `/hooks` en una nueva sesión de Codex y revisar/confiar en ambos hooks.
[Codex exige confiar en la definición exacta](https://learn.chatgpt.com/docs/hooks)
y puede pedirlo de nuevo si cambia; `hook.consent` de Impeccable no sustituye esa
confianza. Si ya hay un hook global de Impeccable, evitar registrar también el
mismo detector en este proyecto.

La configuración compartida y el sidecar se versionan; los overrides locales,
cachés, capturas y sesiones quedan excluidos mediante el bloque oficial de Git.
`.impeccable/live/config.json` apunta a `index.html`; la comprobación inicial no
detectó CSP. Live Mode queda preparado, sin iniciar el helper ni inyectar código.
No se configura una preferencia visual o de construcción por defecto.
