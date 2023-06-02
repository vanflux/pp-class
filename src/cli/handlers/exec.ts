import { CommandHandler } from '../command-handler';

export const execCommandHandler: CommandHandler = {
  name: 'Exec',
  description: 'Execute command on lad',
  handle: async (command, args, { lad }) => {
    if (command !== 'exec') return { stopPropagation: false };
    const cmd = args.join(' ');
    const output = await lad.exec(cmd);
    console.log('[Exec] Output:', output.stdout, output.stderr);
    return { stopPropagation: true };
  },
};
