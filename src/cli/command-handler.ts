import { CLIContext } from '.';

export interface CommandHandlerResult {
  stopPropagation: boolean;
}

export interface CommandHandler {
  name: string;
  description: string;
  handle: (command: string, args: string[], context: CLIContext) => Promise<CommandHandlerResult>;
}
