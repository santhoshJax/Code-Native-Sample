/*****************************************************************
Name:          flows
============================================================
Purpose:       Flow definitions for the integration.

               Flow 1 - "Fetch Accounts"
                 Runs the Salesforce component's Query action with
                   SELECT Id, Name FROM <Salesforce Object>
                   ORDER BY CreatedDate DESC LIMIT <Record Limit>
                 (defaults: Account, 10) and returns
                   { records: [...], count: <n> }.

               Flow 2 - Google Drive TSV import: intentionally deferred.
============================================================
History
-------
VERSION  AUTHOR                 DATE         DETAIL
1.0      Revecast Orchestrate   15/10/2026   Created
*****************************************************************/
import { flow } from "@prismatic-io/spectral";
import {
  CONFIG_RECORD_LIMIT,
  CONFIG_SALESFORCE_CONNECTION,
  CONFIG_SALESFORCE_OBJECT,
} from "./configPages";

/** Salesforce caps a single SOQL response page at 2000 rows. */
export const MAX_RECORD_LIMIT = 2000;

/** Valid Salesforce object API name: Account, My_Object__c, ns__Obj__c, etc. */
const OBJECT_API_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;

export interface SalesforceRecord {
  Id: string;
  Name?: string;
  [field: string]: unknown;
}

export interface FetchAccountsResult {
  records: SalesforceRecord[];
  count: number;
}

/**
 * Builds the SOQL statement from the two config variables.
 *
 * The object name and limit are interpolated into the query text, so both
 * are validated first to rule out SOQL injection via a config value.
 *
 * @throws Error when the object name or limit is invalid.
 */
export const buildFetchQuery = (objectName: string, limit: string | number): string => {
  const trimmedObject = String(objectName ?? "").trim();

  if (!OBJECT_API_NAME_PATTERN.test(trimmedObject)) {
    throw new Error(
      `Invalid "${CONFIG_SALESFORCE_OBJECT}" value "${objectName}". ` +
        "Use a Salesforce object API name such as Account or My_Object__c.",
    );
  }

  const parsedLimit = Number(String(limit ?? "").trim());

  if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > MAX_RECORD_LIMIT) {
    throw new Error(
      `Invalid "${CONFIG_RECORD_LIMIT}" value "${limit}". ` +
        `Use a whole number from 1 to ${MAX_RECORD_LIMIT}.`,
    );
  }

  return `SELECT Id, Name FROM ${trimmedObject} ORDER BY CreatedDate DESC LIMIT ${parsedLimit}`;
};

/**
 * Normalises the Query action output. The Salesforce component returns the
 * REST query response ({ totalSize, done, records }); depending on the
 * component version it may be wrapped in { data: ... }. Strips the
 * per-record `attributes` metadata so callers get clean rows.
 */
export const toFetchResult = (queryOutput: unknown): FetchAccountsResult => {
  const outer = (queryOutput ?? {}) as Record<string, unknown>;
  const payload = (outer.data && typeof outer.data === "object" ? outer.data : outer) as Record<
    string,
    unknown
  >;
  const rawRecords = Array.isArray(payload.records) ? payload.records : [];

  const records = rawRecords.map((raw) => {
    const { attributes: _attributes, ...fields } = raw as Record<string, unknown>;
    return fields as SalesforceRecord;
  });

  return { records, count: records.length };
};

export const fetchAccounts = flow({
  name: "Fetch Accounts",
  stableKey: "fetch-accounts",
  description:
    "Queries the most recently created Salesforce records (default: 10 Accounts) " +
    "and returns the records with a count.",
  isSynchronous: true,
  onExecution: async (context) => {
    const { configVars, components, logger } = context;

    const queryString = buildFetchQuery(
      configVars[CONFIG_SALESFORCE_OBJECT],
      configVars[CONFIG_RECORD_LIMIT],
    );
    logger.info(`Fetch Accounts: running SOQL "${queryString}"`);

    const queryOutput = await components.salesforce.query({
      connection: configVars[CONFIG_SALESFORCE_CONNECTION],
      queryString,
    });

    const result = toFetchResult(queryOutput);
    logger.info(`Fetch Accounts: returned ${result.count} record(s)`);

    return { data: result };
  },
});

export default [fetchAccounts];
