import { jsxTransform } from "emitkit";
import { readFile, writeFile } from "fs/promises";
import plugin from "./transform.js";

const [, , inPath, outPath] = process.argv;

const file = await readFile(inPath);

const tranformed = await jsxTransform(file.toString(), { plugin });

await writeFile(outPath, tranformed.code);
