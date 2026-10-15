# Code-Native-Sample

A **code-native** Revecast Connect integration written in TypeScript. Flows are
plain functions that call published Revecast Connect components (here, the
Salesforce component) and are imported with the `prism` CLI. After import, the
integration opens in the Revecast Connect Designer like any other integration.

## Flows

| # | Flow | What it does | Status |
|---|------|--------------|--------|
| 1 | **Fetch Accounts** | Runs the Salesforce **Query** action with `SELECT Id, Name FROM <Salesforce Object> ORDER BY CreatedDate DESC LIMIT <Record Limit>` (defaults: `Account`, `10`) and returns `{ records, count }`. | Built |
| 2 | Google Drive TSV import | Stream TSV files from Google Drive into Salesforce. | Not started (later) |

Example output of **Fetch Accounts**:

```json
{
  "records": [{ "Id": "001...", "Name": "Acme" }],
  "count": 1
}
```

Salesforce's per-record `attributes` metadata is removed. The flow is
synchronous, so calling its webhook URL returns this payload directly.

## Configuration (deploy wizard)

| Page | Config variable | Type | Default | Notes |
|------|-----------------|------|---------|-------|
| Salesforce Connection | `Salesforce Connection` | Salesforce OAuth 2.0 connection | — | OAuth URLs default to `test.salesforce.com` (sandbox). Client ID and Client Secret are entered in the Designer and are **never committed**. |
| Query Settings | `Salesforce Object` | string | `Account` | Must be a valid object API name (`Account`, `My_Object__c`). |
| Query Settings | `Record Limit` | string | `10` | A whole number from 1 to 2000. |

Both query settings are validated before the SOQL runs, so a config value
cannot inject extra SOQL.

## Project layout

```
src/
  index.ts              integration() entry point
  flows.ts              Flow 1 - Fetch Accounts (+ SOQL builder / result mapper)
  flows.test.ts         Jest unit tests (Salesforce is mocked)
  configPages.ts        Config wizard pages + config variable names
  componentRegistry.ts  Manifest for the published Salesforce component (query + oauth2)
webpack.config.js       Bundles src/ to dist/index.js for import
.github/workflows/revecast-connect-import.yml   CI: npm ci, build, test, prism integrations:import
```

## Local development

Requires Node.js 20 or later.

```bash
npm ci
npm test            # unit tests
npm run build       # writes dist/index.js
npx prism login     # once, against your Revecast Connect stack
npm run import      # build + prism integrations:import
```

To update an integration that already exists, rather than creating a new one:

```bash
npx prism integrations:import --integration-id <INTEGRATION_ID>
```

## CI / CD (GitHub Actions)

`.github/workflows/revecast-connect-import.yml`:

- **Pull requests to `main`:** `npm ci` → `npm run build` → `npm test`. Nothing is imported.
- **Push to `main`, or a manual run:** the same steps, then `prism integrations:import`.

Set these in **Settings → Secrets and variables → Actions**:

| Name | Kind | Value |
|------|------|-------|
| `PRISM_REFRESH_TOKEN` | Secret | `npx prism me:token --type refresh` (run while logged in) |
| `PRISMATIC_URL` | Secret | Your Revecast Connect stack URL |
| `REVECAST_CONNECT_INTEGRATION_ID` | Variable | Leave unset for the first import, then set it to the returned ID so later runs update the same integration |

## After the first import

1. Open the integration in the Designer and enter the Salesforce Connected App
   **Client ID** and **Client Secret** on the connection.
2. Switch the OAuth URLs to `login.salesforce.com` if you are targeting a production org.
3. Run **Fetch Accounts** from the test runner and check that `count` matches the records returned.

## Adding a flow

Add a `flow({...})` to `src/flows.ts` and include it in the default export
array. If it uses another published component, such as Google Drive for the
TSV flow, add that component's actions and connection to
`src/componentRegistry.ts`, and its config variables to `src/configPages.ts`.
