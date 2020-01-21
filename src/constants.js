export const GET_URL_CODE =
  'function __url__(url) { return url.__esModule ? url.default : url; }';

export const IDENT_REGEX = /___HTML_LOADER_IDENT_[0-9.]+___/g;

export const REQUIRE_REGEX = /\${require\([^)]*\)}/g;
