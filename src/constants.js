export const GET_URL_CODE =
  'function __url__(url) { return url.__esModule ? url.default : url; }';

export const IDENT_REGEX = /xxxHTMLLINKxxx[0-9.]+xxx/g;

export const REQUIRE_REGEX = /\${require\([^)]*\)}/g;
