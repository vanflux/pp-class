import EventEmitter from 'events';
import { NodeSSH } from 'node-ssh';
import { Allocation } from './allocation';
import { Readable } from 'stream';

export interface LadConnectOptions {
  registry: string;
  userPrefix: string;
  groupNum: number;
  spartaPass: string;
  gradPass: string;
}

export class Lad extends EventEmitter {
  private spartaSsh?: NodeSSH;
  private gradSsh?: NodeSSH;
  private connecting = false;
  private connected = false;

  private ensureConnected() {
    if (!this.connected) throw new Error('Not connected');
    if (!this.gradSsh) throw new Error('Undefined gradSsh');
  }

  async connect(options: LadConnectOptions) {
    if (this.connecting) return;
    this.connecting = true;
    this.connected = false;
    this.spartaSsh = new NodeSSH();
    this.emit('connecting');
    await this.spartaSsh.connect({
      host: 'sparta.pucrs.br',
      username: `portoalegre\\${options.registry}`,
      password: options.spartaPass,
      timeout: 5 * 60 * 1000,
      readyTimeout: 5 * 60 * 1000,
    });
    this.emit('sparta_connected');
    const gradChannel = await this.spartaSsh.forwardOut('localhost', 2222, 'grad.lad.pucrs.br', 22);
    this.emit('grad_forwarded');
    this.gradSsh = new NodeSSH();
    await this.gradSsh.connect({
      sock: gradChannel,
      username: `${options.userPrefix}${String(options.groupNum).padStart(2, '0')}`,
      password: options.gradPass,
      timeout: 60 * 1000,
    });
    const user = await this.gradSsh.exec('whoami', []);
    this.connected = true;
    this.emit('grad_connected', { user });
    this.emit('connected');
  }

  async alloc(nodes = 1, timeMinutes = 1, exclusive = true) {
    if (!this.connected) throw new Error('Not connected');
    return new Promise<Allocation>((resolve, reject) => {
      if (!this.gradSsh) return reject(new Error('Undefined gradSsh'));
      const stdin = new Readable({ read: () => true });
      this.gradSsh.exec('/LADAPPs/ladscripts/ladalloc', ['-n', String(nodes), '-t', String(timeMinutes), exclusive ? '-e' : '-s'], {
        execOptions: {
          pty: true,
        },
        onChannel: async (channel) => {
          resolve(new Allocation(stdin, channel));
        },
        stdin
      });
    });
  }

  async exec(command: string, parameters: string[] = []) {
    this.ensureConnected();
    return this.gradSsh!.exec(command, parameters);
  }

  async getFile(localFile: string, remoteFile: string) {
    this.ensureConnected();
    return this.gradSsh!.getFile(localFile, remoteFile);
  }

  async putFile(localFile: string, remoteFile: string) {
    this.ensureConnected();
    return this.gradSsh!.putFile(localFile, remoteFile);
  }

  async info() {
    this.ensureConnected();
    return this.gradSsh!.exec('/LADAPPs/ladscripts/ladinfo', [], {
      execOptions: {
        pty: true,
      },
    });
  }
}
