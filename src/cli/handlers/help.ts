import { CommandHandler } from "../command-handler";

export const helpCommandHandler: CommandHandler = {
  name: 'Help',
  description: 'Show help',
  handle: async (command, args, { commandHandlers }) => {
    if (command !== 'help') return { stopPropagation: false };
    console.log('[Help]');
    for (const commandHandler of commandHandlers) {
      console.log(`- ${commandHandler.name}: ${commandHandler.description}`);
    }
    return { stopPropagation: true };
  },
};
