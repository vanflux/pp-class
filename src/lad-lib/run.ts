import { SSHExecCommandResponse } from "node-ssh";
import { Lad } from "./lad";
import { escape } from "./utils";
import EventEmitter from "events";

export interface LadRunOptions {
  command: string;
  nodes?: number;
  tasks?: number;
  maxTasksPerNode?: number;
  shared?: boolean;
}

export class LadRun extends EventEmitter {
  private responsePromise: Promise<SSHExecCommandResponse>;

  constructor(lad: Lad, options: LadRunOptions) {
    super();
    const self = this;
    this.responsePromise = new Promise(async resolve => {
      let command = '';
      command += 'srun --cpu-bind=none';
      command += options.shared ? '' : ' --exclusive';
      command += ` -N ${options.nodes ?? 1}`;
      if (options.maxTasksPerNode != undefined) {
        command += ` --ntasks-per-node ${options.maxTasksPerNode}`;
      }
      if (options.tasks != undefined) {
        command += ` --ntasks ${options.tasks}`;
      }
      command += ` bash -c "${escape(options.command)}"`;
      const response = await lad.exec(command);
      resolve(response);
      self.emit('end');
    })
  }

  async getOutput() {
    return this.responsePromise.then(response => `${response.stdout ?? ''}${response.stderr ?? ''}`);
  }
}
