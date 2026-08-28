// Types for `view-ids.mjs`, so `viewChrome.test.ts` can import it under `tsc -b`.
// The list stays in .mjs because `smoke-views.mjs` is plain node and cannot
// import TypeScript; this is the two-line bridge rather than a second copy.
export declare const VIEW_IDS: string[]
export declare const NOT_SMOKED: Record<string, string>
