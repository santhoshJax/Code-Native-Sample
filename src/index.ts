/*****************************************************************
Name:          index
============================================================
Purpose:       Entry point for the Revecast Connect code-native
               integration. `npm run build` bundles this file to
               dist/index.js, which `prism integrations:import` uploads.
============================================================
History
-------
VERSION  AUTHOR                 DATE         DETAIL
1.0      Revecast Orchestrate   15/10/2026   Created
*****************************************************************/
import { integration } from "@prismatic-io/spectral";
import flows from "./flows";
import { configPages } from "./configPages";
import { componentRegistry } from "./componentRegistry";

export { configPages } from "./configPages";
export { componentRegistry } from "./componentRegistry";

export default integration({
  name: "Code Native Sample",
  description:
    "Code-native sample integration: Salesforce flows built in TypeScript " +
    "(Flow 1 - Fetch Accounts).",
  // Add assets/icon.png and set iconPath: "icon.png" to give the integration an icon.
  flows,
  configPages,
  componentRegistry,
});
