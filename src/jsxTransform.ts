// swc discord said outputting jsx needed rust
// well they were wrong L

import { Options, parse, print } from "@swc/core";

export default async (code: string, opts?: Options) => {
  const ast = await parse(code, opts?.jsc?.parser);
  const transformed = opts?.plugin?.(ast) ?? ast;
  return await print(transformed, opts);
};