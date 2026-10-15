/*****************************************************************
Name:          configPages
============================================================
Purpose:       Config wizard shown when an instance of this integration
               is deployed. Two pages:
                 1. Salesforce Connection - OAuth 2.0 connection to the
                    target org (re-uses the published Salesforce
                    component's "oauth2" connection).
                 2. Query Settings - the object and row limit the
                    "Fetch Accounts" flow queries.

               No credentials are stored in source. Client ID / Secret
               and the OAuth URLs are entered by the organization in the
               Revecast Connect Designer (or set on the instance).
============================================================
History
-------
VERSION  AUTHOR                 DATE         DETAIL
1.0      Revecast Orchestrate   15/10/2026   Created
*****************************************************************/
import { configPage, configVar, connectionConfigVar } from "@prismatic-io/spectral";

/** Config variable names - referenced by flows.ts, so keep them in one place. */
export const CONFIG_SALESFORCE_CONNECTION = "Salesforce Connection";
export const CONFIG_SALESFORCE_OBJECT = "Salesforce Object";
export const CONFIG_RECORD_LIMIT = "Record Limit";

export const configPages = {
  "Salesforce Connection": configPage({
    tagline: "Connect to the Salesforce org this integration reads from.",
    elements: {
      [CONFIG_SALESFORCE_CONNECTION]: connectionConfigVar({
        stableKey: "salesforce-connection",
        dataType: "connection",
        connection: {
          component: "salesforce",
          key: "oauth2",
          values: {
            // Sandbox defaults; switch to login.salesforce.com for production orgs.
            authorizeUrl: {
              value: "https://test.salesforce.com/services/oauth2/authorize",
              permissionAndVisibilityType: "organization",
              visibleToOrgDeployer: true,
            },
            tokenUrl: {
              value: "https://test.salesforce.com/services/oauth2/token",
              permissionAndVisibilityType: "organization",
              visibleToOrgDeployer: true,
            },
            revokeUrl: {
              value: "https://test.salesforce.com/services/oauth2/revoke",
              permissionAndVisibilityType: "organization",
              visibleToOrgDeployer: true,
            },
            // Supplied by the organization in the Designer - never committed to git.
            clientId: {
              permissionAndVisibilityType: "organization",
              visibleToOrgDeployer: false,
            },
            clientSecret: {
              permissionAndVisibilityType: "organization",
              visibleToOrgDeployer: false,
              writeOnly: true,
            },
          },
        },
      }),
    },
  }),
  "Query Settings": configPage({
    tagline: "Choose what the Fetch Accounts flow queries.",
    elements: {
      [CONFIG_SALESFORCE_OBJECT]: configVar({
        stableKey: "salesforce-object",
        dataType: "string",
        defaultValue: "Account",
        description: "API name of the Salesforce object to query (e.g. Account).",
      }),
      [CONFIG_RECORD_LIMIT]: configVar({
        stableKey: "record-limit",
        dataType: "string",
        defaultValue: "10",
        description: "Maximum number of records to return (1-2000).",
      }),
    },
  }),
};

/*
 * Module augmentation: makes `context.configVars` in every flow strongly
 * typed against the pages above (e.g. configVars["Record Limit"] is a string).
 */
type TConfigPages = typeof configPages;

declare module "@prismatic-io/spectral" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface IntegrationDefinitionConfigPages extends TConfigPages {}
}
