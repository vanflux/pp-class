import { resolve } from "path";

const programPath = resolve(__dirname, './program');
const srcProgramHello = resolve(programPath, 'hello.cpp');
const outPath = resolve(__dirname, './out');

export {
  programPath,
  srcProgramHello,
  outPath,
};
