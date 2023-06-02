import 'dotenv/config';
import { stdin, stdout } from 'process';
import { Interface, createInterface } from 'readline';
import { Lad, LadConfigHelper } from '../lad-lib';
import { helpCommandHandler } from './handlers/help';
import { CommandHandler } from './command-handler';
import { t1CommandHandlers, t1Setup } from '../t1-omp';
import { t2CommandHandlers, t2Setup } from '../t2-mpi';
import { infoCommandHandler } from './handlers/info';
import { execCommandHandler } from './handlers/exec';

export interface CLIContext {
  commandHandlers: CommandHandler[];
  lad: Lad;
}

async function nextCmd(rl: Interface, text: string) {
  return new Promise<string>((resolve) => {
    rl.question(text, resolve);
  });
}

async function main() {
  const t = process.argv[2];
  const tCommandHandlers =
    {
      t1: t1CommandHandlers,
      t2: t2CommandHandlers,
    }[t] ?? [];
  const tSetup =
    {
      t1: t1Setup,
      t2: t2Setup,
    }[t] ?? (() => {});

  const commandHandlers = [helpCommandHandler, infoCommandHandler, execCommandHandler, ...tCommandHandlers];
  const rl = createInterface({ input: stdin, output: stdout });
  const config = LadConfigHelper.fromEnv();
  const lad = new Lad();
  lad.on('connecting', () => console.log('[SSH] Connecting to sparta (sometimes this could take 1-2 minutes)'));
  lad.on('sparta_connected', () => console.log('[SSH] Forwarding grad'));
  lad.on('grad_forwarded', () => console.log('[SSH] Connected to sparta'));
  lad.on('grad_connected', ({ user }) => console.log('[SSH] Connected as', user));
  await lad.connect(config);
  const context: CLIContext = {
    commandHandlers,
    lad,
  };
  await tSetup(context);
  while (true) {
    const input = await nextCmd(rl, '');
    const [command, ...args] = input.split(/\s+/g);
    let unknownCommand = true;
    for (const commandHandler of commandHandlers) {
      const result = await commandHandler.handle(command, args, context);
      if (result.stopPropagation) {
        unknownCommand = false;
        break;
      }
    }
    if (unknownCommand) {
      console.log(`[CMD] Unknown command "${command}"`);
    }
  }
}

main();
