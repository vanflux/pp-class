import { resolve } from "path";

const dataScenesPath = resolve(__dirname, './scenes');
const programPath = resolve(__dirname, './program');
const srcProgramSerialPath = resolve(programPath, 'serial.cpp');
const srcProgramParallelPath = resolve(programPath, 'parallel.cpp');
const outPath = resolve(__dirname, './out');
const programOutPath = resolve(outPath, 'output.txt');
const imageOutPath = resolve(outPath, 'output.png');

export {
  dataScenesPath,
  programPath,
  srcProgramSerialPath,
  srcProgramParallelPath,
  outPath,
  programOutPath,
  imageOutPath,
};
