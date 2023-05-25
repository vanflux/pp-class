import 'dotenv/config';
import { mkdirSync, readFileSync, readdirSync, statSync } from "fs";
import { basename } from "path";
import { stdin, stdout } from "process";
import { Interface, createInterface } from "readline";
import { dataScenesPath, imageOutPath, outPath, programOutPath, srcProgramParallelPath, srcProgramSerialPath } from "./paths";
import Jimp from "jimp";
import { Lad, LadConfigHelper } from "../lad-lib";
import { watch } from "chokidar";

function watchFiles(lad: Lad) {
  watch(srcProgramParallelPath).on('all', async () => {
    console.log('[Watcher] Sending and compiling parallel');
    await lad.exec('mkdir', ['-p', 'vf']);
    await lad.putFile(srcProgramParallelPath, 'vf/parallel.cpp');
    try {
      await lad.exec('g++', ['-fopenmp', 'vf/parallel.cpp', '-o', 'vf/parallel']);
    } catch (exc) {
      console.error(exc);
    }
  });

  watch(srcProgramSerialPath).on('all', async () => {
    console.log('[Watcher] Sending and compiling serial');
    await lad.exec('mkdir', ['-p', 'vf']);
    await lad.putFile(srcProgramSerialPath, 'vf/serial.cpp');
    try {
      await lad.exec('g++', ['vf/serial.cpp', '-o', 'vf/serial']);
    } catch (exc) {
      console.error(exc);
    }
  });

  watch(dataScenesPath).on('all', async (_, path) => {
    const isDir = statSync(path).isDirectory();
    if (isDir) return;
    const fileName = basename(path);
    console.log('[Watcher] Sending scene', fileName);
    await lad.exec('mkdir', ['-p', 'vf/scenes']);
    await lad.putFile(path, `vf/scenes/${fileName}`);
  });
}

async function nextCmd(rl: Interface, text: string) {
  return new Promise<string>((resolve) => {
    rl.question(text, resolve);
  });
}

function parseCmd(input: string) {
  const params = input.split(' ');
  const isParallel = params[0]?.[0] === 'p';
  let threads = 1;
  if (isParallel) {
    threads = parseInt(params[0]?.substring(1));
    if (isNaN(threads) || threads < 0) {
      console.log('[CMD] Invalid threads number');
      return;
    }
  }
  const sceneNum = parseInt(params[1]);
  const scenes = readdirSync(dataScenesPath).filter((name) => name.startsWith('scene-'));
  if (isNaN(sceneNum) || sceneNum < 0 || sceneNum >= scenes.length) {
    console.log('[CMD] Invalid scene number');
    return;
  }
  const iterations = parseInt(params[2]);
  if (isNaN(iterations) || iterations < 0) {
    console.log('[CMD] Invalid iterations number');
    return;
  }
  return { isParallel, threads, sceneNum, iterations };
}

function generateImage() {
  const input = readFileSync(programOutPath, 'utf8');

  const imageData: number[][] = [];
  let y = 0;
  for (const line of input.split('\n')) {
    if (!line) continue;
    imageData.push([]);
    const row = imageData[y];
    let x = 0;
    for (const item of line.split(' ')) {
      if (!item) continue;
      row.push(item === '.' ? 0x000000ff : 0xffffffff);
      x++;
    }
    y++;
  }

  const height = imageData.length;
  const width = imageData[0].length;

  new Jimp(width, height, function (err, image) {
    if (err) throw err;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        image.setPixelColor(imageData[y][x], x, y);
      }
    }
    image.write(imageOutPath, (err) => {
      if (err) throw err;
    });
  });
}

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });
  const config = LadConfigHelper.fromEnv();
  const lad = new Lad();
  lad.on('connecting', () => console.log('[SSH] Connecting to sparta (sometimes this could take 1-2 minutes)'));
  lad.on('sparta_connected', () => console.log('[SSH] Forwarding grad'));
  lad.on('grad_forwarded', () => console.log('[SSH] Connected to sparta'));
  lad.on('grad_connected', ({ user }) => console.log('[SSH] Connected as', user));
  await lad.connect(config);
  watchFiles(lad);
  console.log('[Help] Usage: <s|p{1-16}> <scene_number> <iterations>');
  while (true) {
    const input = await nextCmd(rl, '');
    const parsed = parseCmd(input);
    if (!parsed) continue;
    const { isParallel, threads, sceneNum, iterations } = parsed;
    const inputPath = `vf/scenes/scene-${sceneNum}.txt`;
    console.log('[Grad] Allocating');
    let command = '';
    if (isParallel) {
      command = `time OMP_NUM_THREADS=${threads} ./vf/parallel "${inputPath}" ${iterations} vf/program-out.txt\nexit\n`;
    } else {
      command = `time ./vf/serial "${inputPath}" ${iterations} vf/program-out.txt\nexit\n`;
    }
    const allocation = await lad.alloc();
    allocation.exec(command);
    allocation.end();
    const rawOutput = await allocation.getOutput();
    const output = rawOutput.replace(/[\n\r]/g, ' ');
    const matches = output.match(/real\s+([^\s]+)/);
    if (matches) {
      const time = matches[1];
      console.log('[Grad] Output:', output);
      console.log('[Grad] Time:', time);
    } else {
      console.log('[Grad] Error, messages:', output);
    }
    console.log('[Grad] Deallocated, copying output');
    mkdirSync(outPath, { recursive: true });
    await lad.getFile(programOutPath, 'vf/program-out.txt');
    generateImage();
  }
}

main();
