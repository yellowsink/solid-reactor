import { readFile, writeFile } from "fs/promises";
import transform from "./transform.js";

const [, , inPath, outPath] = process.argv;

const file = await readFile(inPath);

const tranformed = await transform(file.toString());

await writeFile(outPath, tranformed);
