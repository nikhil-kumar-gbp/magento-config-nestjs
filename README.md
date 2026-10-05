# Magento Configuration Service

NestJS service that reads Magento `etc/adminhtml/system.xml` files and looks up stored values from `core_config_data`.

The Magento project stays outside this folder. This app only reads `app/code` and the MySQL table named in the entity.

## Setup

```bash
cp .env.example .env
npm install
npm run start:dev
```

```text
MAGENTO_ROOT=/absolute/path/to/magento
PORT=8000
STATIC_BEARER_TOKEN=your-token

DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=secret
DB_NAME=magento
```

`MAGENTO_ROOT` must be an existing directory. The app checks that when it starts. If `PORT` is unset, the server listens on `8000`.

## Authentication

Every route requires a bearer token that matches `STATIC_BEARER_TOKEN`.

```http
Authorization: Bearer your-token
```

A missing or wrong token returns `403`.

## Base URL

```text
http://localhost:8000/api/v1
```

## APIs

### List modules

```http
GET /api/v1/modules/list
```

Reads `MAGENTO_ROOT/app/code` and returns module names shaped like `Vendor_Module`.

```bash
curl -s http://localhost:8000/api/v1/modules/list \
  -H "Authorization: Bearer your-token"
```

```json
["Gbp_CarCover", "Vendor_Module"]
```

| Status | When                      |
| ------ | ------------------------- |
| 200    | The module list was read  |
| 403    | Token is missing or wrong |

### Read a module's system.xml

```http
GET /api/v1/modules/config/:module
```

`:module` is a Magento module name, `Vendor_Module`. The app maps that to:

```text
MAGENTO_ROOT/app/code/Vendor/Module/etc/adminhtml/system.xml
```

`Gbp_CarCover` is `app/code/Gbp/CarCover`.

```bash
curl -s http://localhost:8000/api/v1/modules/config/Gbp_CarCover \
  -H "Authorization: Bearer your-token"
```

When the module folder exists and `system.xml` is valid, the response is `200` with `available: true`, plus `tabs` and `sections`. `includes` and `additional` appear only when the XML has them.

```json
{
  "module": "Gbp_CarCover",
  "file": "etc/adminhtml/system.xml",
  "available": true,
  "tabs": [
    {
      "id": "gbp",
      "sortOrder": "10",
      "label": "GBP"
    }
  ],
  "sections": [
    {
      "id": "car_cover",
      "label": "Car Cover",
      "tab": "gbp",
      "groups": [
        {
          "id": "general",
          "label": "General",
          "fields": [
            {
              "id": "enabled",
              "type": "select",
              "label": "Enabled",
              "configPath": "section/group/field",
              "sourceModel": "",
              "backendModel": ""
            }
          ]
        }
      ]
    }
  ]
}
```

When the module folder exists but `system.xml` is missing, the response is still `200`:

```json
{
  "module": "Vendor_Module",
  "file": "etc/adminhtml/system.xml",
  "available": false,
  "tabs": [],
  "sections": []
}
```

| Status | When                                                      |
| ------ | --------------------------------------------------------- |
| 200    | XML was parsed, or the module exists without `system.xml` |
| 400    | Name is not `Vendor_Module`                               |
| 403    | Token is missing or wrong                                 |
| 404    | `app/code/Vendor/Module` does not exist                   |
| 422    | `system.xml` is not valid XML                             |
| 500    | The module directory or XML file cannot be read           |

### Read a stored config value

```http
POST /api/v1/modules/field-value
```

Looks up one row in `core_config_data` by Magento config path.

```bash
curl -s http://localhost:8000/api/v1/modules/field-value \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"path":"web/unsecure/base_url"}'
```

```json
{
  "config_id": 1,
  "scope": "default",
  "scope_id": 0,
  "path": "web/unsecure/base_url",
  "value": "https://example.com/",
  "updated_at": "2026-10-05T12:00:00.000Z"
}
```

`scope` is one of `default`, `website`, or `store`.

| Status | When                        |
| ------ | --------------------------- |
| 200    | A row exists for that path  |
| 403    | Token is missing or wrong   |
| 404    | No row exists for that path |

## Layout

```text
src/main.ts                              starts the HTTP server
src/app.module.ts                        config, MySQL, and the feature module
src/magento-config/magento-config.controller.ts   routes
src/magento-config/magento-config.service.ts      module files and config lookup
src/magento-config/magento-config.entity.ts       core_config_data
src/guards/auth.guard.ts                 bearer token check
src/config/mysql.config.ts               TypeORM connection
src/xml/                                 turns system.xml into JSON
```
