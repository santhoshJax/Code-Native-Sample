/*
 * Unit tests for the "Fetch Accounts" flow.
 * Data assumptions: no real Salesforce data is used. The Salesforce Query
 * action is mocked via a fake `components.salesforce.query`.
 */
import { buildFetchQuery, fetchAccounts, MAX_RECORD_LIMIT, toFetchResult } from "./flows";

describe("buildFetchQuery", () => {
  it("builds the default Account query", () => {
    expect(buildFetchQuery("Account", "10")).toBe(
      "SELECT Id, Name FROM Account ORDER BY CreatedDate DESC LIMIT 10",
    );
  });

  it("accepts custom objects and numeric limits, trimming whitespace", () => {
    expect(buildFetchQuery("  My_Object__c ", 25)).toBe(
      "SELECT Id, Name FROM My_Object__c ORDER BY CreatedDate DESC LIMIT 25",
    );
  });

  it.each(["", "Account; DELETE", "Account WHERE Id != null", "1Account", "Acc'ount"])(
    "rejects unsafe object name %p",
    (objectName) => {
      expect(() => buildFetchQuery(objectName, "10")).toThrow(/Salesforce Object/);
    },
  );

  it.each(["0", "-1", "abc", "2.5", String(MAX_RECORD_LIMIT + 1), "10 OFFSET 5"])(
    "rejects invalid limit %p",
    (limit) => {
      expect(() => buildFetchQuery("Account", limit)).toThrow(/Record Limit/);
    },
  );
});

describe("toFetchResult", () => {
  const rows = Array.from({ length: 20 }, (_, index) => ({
    attributes: { type: "Account", url: `/x/${index}` },
    Id: `001${index}`,
    Name: `Account ${index}`,
  }));

  it("strips attributes and counts records (bulk: 20 rows)", () => {
    const result = toFetchResult({ totalSize: 20, done: true, records: rows });
    expect(result.count).toBe(20);
    expect(result.records[0]).toEqual({ Id: "0010", Name: "Account 0" });
  });

  it("unwraps a { data: ... } envelope", () => {
    expect(toFetchResult({ data: { records: rows.slice(0, 2) } }).count).toBe(2);
  });

  it("returns an empty result for empty or unexpected output", () => {
    expect(toFetchResult(undefined)).toEqual({ records: [], count: 0 });
    expect(toFetchResult({ records: "nope" })).toEqual({ records: [], count: 0 });
  });
});

describe("Fetch Accounts flow", () => {
  const buildContext = (configVars: Record<string, unknown>, queryImpl: jest.Mock) =>
    ({
      configVars,
      logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
      components: { salesforce: { query: queryImpl } },
    }) as never;

  it("runs the Query action and returns records + count", async () => {
    const query = jest.fn().mockResolvedValue({
      data: { totalSize: 1, done: true, records: [{ attributes: {}, Id: "001A", Name: "Acme" }] },
    });
    const connection = { key: "oauth2" };

    const result = await fetchAccounts.onExecution(
      buildContext(
        { "Salesforce Connection": connection, "Salesforce Object": "Account", "Record Limit": "10" },
        query,
      ),
    );

    expect(query).toHaveBeenCalledWith({
      connection,
      queryString: "SELECT Id, Name FROM Account ORDER BY CreatedDate DESC LIMIT 10",
    });
    expect(result).toEqual({ data: { records: [{ Id: "001A", Name: "Acme" }], count: 1 } });
  });

  it("fails before calling Salesforce when config is invalid", async () => {
    const query = jest.fn();
    await expect(
      fetchAccounts.onExecution(
        buildContext({ "Salesforce Object": "Account", "Record Limit": "0" }, query),
      ),
    ).rejects.toThrow(/Record Limit/);
    expect(query).not.toHaveBeenCalled();
  });
});
