/*****************************************************************
Name:          componentRegistry
============================================================
Purpose:       Declares the published Revecast Connect components this
               code-native integration calls. Only the actions and
               connections we actually use are listed, which keeps the
               typed `context.components.*` surface small and explicit.

               The Salesforce manifest is written inline (rather than
               installed from a generated @component-manifests package)
               so the project builds with public npm packages only.
               Input keys mirror the published Salesforce component:
                 query  -> queryString (required), version (optional),
                           connection (required)
                 oauth2 -> authorizeUrl, tokenUrl, revokeUrl,
                           clientId, clientSecret
============================================================
History
-------
VERSION  AUTHOR                 DATE         DETAIL
1.0      Revecast Orchestrate   15/10/2026   Created
*****************************************************************/
import { componentManifests } from "@prismatic-io/spectral";

/** Placeholder perform: the platform executes the real component action. */
const passThrough = (values: unknown): Promise<unknown> => Promise.resolve(values);

export const componentRegistry = componentManifests({
  salesforce: {
    key: "salesforce",
    public: true,
    signature: null,
    actions: {
      query: {
        perform: passThrough as (values: {
          connection: unknown;
          queryString: string;
          version?: string;
        }) => Promise<unknown>,
        inputs: {
          connection: { inputType: "connection", required: true },
          queryString: { inputType: "string", required: true },
          version: { inputType: "string", required: false },
        },
      },
    },
    triggers: {},
    dataSources: {},
    connections: {
      oauth2: {
        perform: passThrough as (values: {
          authorizeUrl: string;
          tokenUrl: string;
          revokeUrl: string;
          clientId: string;
          clientSecret: string;
        }) => Promise<unknown>,
        inputs: {
          authorizeUrl: { inputType: "string", required: true },
          tokenUrl: { inputType: "string", required: true },
          revokeUrl: { inputType: "string", required: true },
          clientId: { inputType: "string", required: true },
          clientSecret: { inputType: "password", required: true },
        },
      },
    },
  },
});

/*
 * Module augmentation: tells Spectral which components exist so that
 * connection config vars and `context.components.salesforce.query`
 * are type-checked against the manifest above.
 */
type TComponentRegistry = typeof componentRegistry;

declare module "@prismatic-io/spectral" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface IntegrationDefinitionComponentRegistry extends TComponentRegistry {}
}
