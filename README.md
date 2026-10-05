# Magento Configuration Service

Small NestJS app that reads one Magento module's `etc/adminhtml/system.xml` and returns JSON.

The Magento project stays outside this folder. This app only looks in `app/code`.

## Setup

```bash
cp .env.example .env
```

```text
MAGENTO_ROOT=/absolute/path/to/magento
PORT=3000
```

`MAGENTO_ROOT` must be a directory. The app checks that when it starts.

```bash
npm install
npm run start:dev
```

## API

```text
GET /modules/config/:module
```

```text
GET /modules/config/Gbp_CarCover
```

`:module` is a Magento module name, `Vendor_Module`. The app maps that to:

```text
MAGENTO_ROOT/app/code/Vendor/Module/etc/adminhtml/system.xml
```

So `Gbp_CarCover` is `app/code/Gbp/CarCover`.

If the module folder exists and `system.xml` is valid, the response is `200` with `available: true`, plus `tabs` and `sections`.

If the module folder exists but there is no `system.xml`, the response is still `200`:

```json
{
  "module": "Vendor_Module",
  "file": "etc/adminhtml/system.xml",
  "available": false,
  "tabs": [],
  "sections": []
}
```

| Situation | Status |
| --- | --- |
| Name is not `Vendor_Module` | 400 |
| `app/code/Vendor/Module` does not exist | 404 |
| `system.xml` is not valid XML | 422 |

A walkthrough of the NestJS classes is in [docs/request-journey.md](docs/request-journey.md).

## Layout

```text
src/main.ts                         starts the HTTP server
src/app.module.ts                   registers the controller and service
src/magento-config.controller.ts    the route
src/magento-config.service.ts       finds the module and reads the file
src/xml/                            turns system.xml into JSON
```
