import { jsxTransform } from "emitkit";
import { readFile, writeFile } from "fs/promises";
import plugin from "./transform.js";
import * as swc from "@swc/core";

const [, , inPath, outPath] = process.argv;

const file = await readFile(inPath);

const tranformed = jsxTransform(swc)(file.toString(), { plugin });

await writeFile(outPath, tranformed.code);
