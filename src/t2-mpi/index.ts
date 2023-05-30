import { Lad } from '../lad-lib';
import { watch } from 'chokidar';
import { srcProgramHello } from './paths';
import { CLIContext } from '../cli';
import { CommandHandler } from '../cli/command-handler';

function watchFiles(lad: Lad) {
  watch(srcProgramHello).on('all', async () => {
    console.log('[Watcher] Sending and compiling hello');
    await lad.exec('mkdir -p vf');
    await lad.putFile(srcProgramHello, 'vf/hello.cpp');
    try {
      const { code, stdout, stderr } = await lad.compile(true, true, true, 'vf/hello.cpp', 'vf/hello');
      if (code === 0) return console.log('[Watcher] Hello compiled!');
      console.log('[Watcher] Hello compilation error:', stdout, stderr);
    } catch (exc) {
      console.error(exc);
    }
  });
}

export const t2Setup = async ({ lad }: CLIContext) => {
  console.log('[T2] Setup');
  watchFiles(lad);
};

export const t2CommandHandlers: CommandHandler[] = [
  {
    name: 'run',
    description: 'Run t2, run <threads> <nodes> <tasks>',
    handle: async (command, args, { lad }) => {
      if (command !== 'run') return { stopPropagation: false };

      if (args.length < 3) {
        console.log('[CMD] Invalid args length, 3 args required');
        return { stopPropagation: true };
      }

      const threads = parseInt(args[0]);
      if (isNaN(threads) || threads < 0) {
        console.log('[CMD] Invalid threads number');
        return { stopPropagation: true };
      }
      const nodes = parseInt(args[1]);
      if (isNaN(nodes) || nodes < 0) {
        console.log('[CMD] Invalid nodes number');
        return { stopPropagation: true };
      }
      const tasks = parseInt(args[2]);
      if (isNaN(tasks) || tasks < 0) {
        console.log('[CMD] Invalid tasks number');
        return { stopPropagation: true };
      }

      console.log('[CMD] Allocating');
      const run = await lad.run({
        command: `time OMP_NUM_THREADS=${threads} vf/hello`,
        nodes,
        tasks,
      });
      console.log('[CMD] Output:', await run.getOutput());

      return { stopPropagation: true };
    },
  },
];
