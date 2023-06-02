import { Lad } from '../lad-lib';
import { watch } from 'chokidar';
import { outPath, programPath } from './paths';
import { CLIContext } from '../cli';
import { CommandHandler } from '../cli/command-handler';
import { dirname, join, relative, resolve } from 'path';
import { mkdirSync, writeFileSync } from 'fs';

function watchFiles(lad: Lad) {
  function debounce(func: (this: any, ...args: any) => any, timeout: number) {
    let timer: NodeJS.Timer;
    return function (this: any, ...args: any) {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), timeout);
    };
  }

  const debouncedCompile = debounce(async () => {
    try {
      const { code, stdout, stderr } = await lad.exec('make', { cwd: 'vf/mpi' });
      if (code === 0) return console.log('[Watcher] Compiled!');
      console.log('[Watcher] Compilation error:', stdout, stderr);
    } catch (exc) {
      console.error(exc);
    }
  }, 1000)

  const queue: { eventName: string, path: string }[] = [];

  async function process() {
    while (true) {
      if (queue.length > 0) {
        const { eventName, path } = queue.shift()!;
        (async () => {
          try {
            const remotePath = join('vf/mpi', relative(programPath, path));
            if (eventName === 'add' || eventName === 'change' || eventName === 'unlink') {
              console.log('[Watcher] Sending and compiling', path, remotePath, `mkdir -p vf/mpi`);
              await lad.putFile(path, remotePath);
              //await new Promise(resolve => setTimeout(resolve, 300));
              debouncedCompile();
            } else {
              await lad.exec(`mkdir -p ${dirname(remotePath)}`);
            }
          } catch(exc) {
            console.log('[Watcher] Error on watch', eventName, path);
          }
        })()
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  process();

  watch(programPath).on('all', async (eventName, path) => {
    queue.push({ eventName, path });
  });
}

export const t2Setup = async ({ lad }: CLIContext) => {
  console.log('[T2] Setup');
  watchFiles(lad);
};

export const t2CommandHandlers: CommandHandler[] = [
  {
    name: 'run',
    description: 'Run t2, run <map_size> <threads> <nodes> <tasks> <iterations>',
    handle: async (command, args, { lad }) => {
      if (command !== 'run') return { stopPropagation: false };

      if (args.length < 5) {
        console.log('[CMD] Invalid args length, 5 args required');
        return { stopPropagation: true };
      }

      const mapSize = parseInt(args[0]);
      if (isNaN(mapSize) || mapSize < 0) {
        console.log('[CMD] Invalid map size number');
        return { stopPropagation: true };
      }
      const threads = parseInt(args[1]);
      if (isNaN(threads) || threads < 0) {
        console.log('[CMD] Invalid threads number');
        return { stopPropagation: true };
      }
      const nodes = parseInt(args[2]);
      if (isNaN(nodes) || nodes < 0) {
        console.log('[CMD] Invalid nodes number');
        return { stopPropagation: true };
      }
      const tasks = parseInt(args[3]);
      if (isNaN(tasks) || tasks < 0) {
        console.log('[CMD] Invalid tasks number');
        return { stopPropagation: true };
      }
      const iterations = parseInt(args[4]);
      if (isNaN(iterations) || iterations < 0) {
        console.log('[CMD] Invalid iterations number');
        return { stopPropagation: true };
      }

      console.log('[CMD] Generating random map');
      const mapNumbers = new Int8Array(mapSize * mapSize);
      for (let i = 0; i < mapNumbers.length; i++) {
        mapNumbers[i] = Math.random() > 0.5 ? 1 : 0;
      }
      const map = mapNumbers.join('');
      mkdirSync(outPath, { recursive: true });
      const mapPath = resolve(outPath, 'map');
      writeFileSync(mapPath, map, 'utf8');

      console.log('[CMD] Sending map', Math.ceil(map.length / 1000000), 'MB');
      await lad.exec('mkdir -p vf/scenes');
      await lad.putFile(mapPath, 'vf/scenes/gen');

      console.log('[CMD] Allocating');
      const run = await lad.run({
        command: `time OMP_NUM_THREADS=${threads} vf/mpi/build/main.x -l ${iterations} -n ${mapSize} -i vf/scenes/gen -r 1`,
        nodes,
        tasks,
      });
      console.log('[CMD] Output:', await run.getOutput());

      return { stopPropagation: true };
    },
  },
];
