import { CommandHandler } from "../command-handler";

export const infoCommandHandler: CommandHandler = {
  name: 'Info',
  description: 'Show lad info',
  handle: async (command, args, { lad }) => {
    if (command !== 'info') return { stopPropagation: false };
    console.log('[Info]');
    const info = await lad.info();
    console.log(info
      ?.map(row => `[${row.nodeList}] Nodes: ${row.nodes}, State: ${row.state}, CPUs: ${row.cpus}, Mem: ${row.memory} MB, Reason: ${row.reason}`)
      .join('\n')
    );
    return { stopPropagation: true };
  },
};
