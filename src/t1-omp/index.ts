import { mkdirSync, readFileSync, readdirSync, statSync } from "fs";
import { basename } from "path";
import { dataScenesPath, imageOutPath, outPath, programOutPath, srcProgramParallelPath, srcProgramSerialPath } from "./paths";
import Jimp from "jimp";
import { Lad } from "../lad-lib";
import { watch } from "chokidar";
import { CommandHandler } from '../cli/command-handler';
import { CLIContext } from '../cli';

function watchFiles(lad: Lad) {
  watch(srcProgramParallelPath).on('all', async () => {
    console.log('[Watcher] Sending and compiling parallel');
    await lad.exec('mkdir -p vf');
    await lad.putFile(srcProgramParallelPath, 'vf/parallel.cpp');
    try {
      const { code, stdout, stderr } = await lad.compile(true, true, false, 'vf/parallel.cpp', 'vf/parallel');
      if (code === 0) return console.log('[Watcher] Parallel compiled!');
      console.log('[Watcher] Parallel compilation error:', stdout, stderr);
    } catch (exc) {
      console.error(exc);
    }
  });

  watch(srcProgramSerialPath).on('all', async () => {
    console.log('[Watcher] Sending and compiling serial');
    await lad.exec('mkdir -p vf');
    await lad.putFile(srcProgramSerialPath, 'vf/serial.cpp');
    try {
      const { code, stdout, stderr } = await lad.compile(true, false, false, 'vf/serial.cpp', 'vf/serial');
      if (code === 0) return console.log('[Watcher] Serial compiled!');
      console.log('[Watcher] Serial compilation error:', stdout, stderr);
    } catch (exc) {
      console.error(exc);
    }
  });

  watch(dataScenesPath).on('all', async (_, path) => {
    const isDir = statSync(path).isDirectory();
    if (isDir) return;
    const fileName = basename(path);
    console.log('[Watcher] Sending scene', fileName);
    await lad.exec('mkdir -p vf/scenes');
    await lad.putFile(path, `vf/scenes/${fileName}`);
  });
}

function generateImage() {
  const input = readFileSync(programOutPath, 'utf8');

  const imageData: number[][] = [];
  let y = 0;
  for (const line of input.split('\n')) {
    if (!line) continue;
    imageData.push([]);
    const row = imageData[y];
    for (const item of line.split(' ')) {
      if (!item) continue;
      row.push(item === '.' ? 0x000000ff : 0xffffffff);
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

export const t1Setup = async ({ lad }: CLIContext) => {
  console.log('[T1] Setup');
  watchFiles(lad);
};

export const t1CommandHandlers: CommandHandler[] = [
  {
    name: 's|p[1-16]',
    description: 'Run t1, <s|p{1-16}> <scene_number> <iterations>',
    handle: async (command, args, { lad }) => {
      if (!command.match(/^s|(p\d+)$/)) return { stopPropagation: false };

      if (args.length < 2) {
        console.log('[CMD] Invalid args length, 2 args required');
        return { stopPropagation: true };
      }

      const isParallel = command[0] === 'p';
      let threads = 1;
      if (isParallel) {
        threads = parseInt(command.substring(1));
        if (isNaN(threads) || threads < 0) {
          console.log('[CMD] Invalid threads number');
          return { stopPropagation: true };
        }
      }
      const sceneNum = parseInt(args[0]);
      const scenes = readdirSync(dataScenesPath).filter((name) => name.startsWith('scene-'));
      if (isNaN(sceneNum) || sceneNum < 0 || sceneNum >= scenes.length) {
        console.log('[CMD] Invalid scene number');
        return { stopPropagation: true };
      }
      const iterations = parseInt(args[1]);
      if (isNaN(iterations) || iterations < 0) {
        console.log('[CMD] Invalid iterations number');
        return { stopPropagation: true };
      }

      const inputPath = `vf/scenes/scene-${sceneNum}.txt`;
      console.log('[CMD] Allocating');
      let cmd = '';
      if (isParallel) {
        cmd = `time OMP_NUM_THREADS=${threads} ./vf/parallel "${inputPath}" ${iterations} vf/program-out.txt\nexit\n`;
      } else {
        cmd = `time ./vf/serial "${inputPath}" ${iterations} vf/program-out.txt\nexit\n`;
      }
      const run = lad.run({ command: cmd });
      const rawOutput = await run.getOutput();
      const output = rawOutput.replace(/[\n\r]/g, ' ');
      const matches = output.match(/real\s+([^\s]+)/);
      if (matches) {
        const time = matches[1];
        console.log('[CMD] Time:', time);
      } else {
        console.log('[CMD] Output:', output);
        console.log('[CMD] Error, messages:', output);
      }
      console.log('[CMD] Deallocated, copying output');
      mkdirSync(outPath, { recursive: true });
      await lad.getFile(programOutPath, 'vf/program-out.txt');
      generateImage();

      return { stopPropagation: true };
    },
  },
];
