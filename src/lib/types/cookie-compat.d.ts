import 'cookie';

declare module 'cookie' {
  export type CookieParseOptions = ParseOptions;
  export type CookieSerializeOptions = SerializeOptions;
}
