// import * as path from "path";
const { version } = require('../../package.json');

export const VERSION_VALUE = version;

type api_endpoint = "https://api.harmonylang.dev" | `http://localhost:${number}`;
export const HARMONY_SERVER_API: api_endpoint = "https://api.harmonylang.dev";