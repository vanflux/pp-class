import { resolve } from 'path';

const programPath = resolve(__dirname, './program');
const srcProgram = resolve(programPath, 'srcProgram');
const outPath = resolve(__dirname, './out');

export { programPath, srcProgram, outPath };
