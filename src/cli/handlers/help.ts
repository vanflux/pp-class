import { CommandHandler } from "../command-handler";

export const helpCommandHandler: CommandHandler = {
  name: 'Help',
  description: 'Shows help',
  handle: async (command, args, context) => {
    if (command !== 'help') return { stopPropagation: false };
    console.log('[Help]');
    for (const commandHandler of context.commandHandlers) {
      console.log(`- ${commandHandler.name}: ${commandHandler.description}`);
    }
    return { stopPropagation: true };
  },
};
