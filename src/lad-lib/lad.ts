import EventEmitter from 'events';
import { NodeSSH, SSHExecOptions } from 'node-ssh';
import { escape } from './utils';
import { LadRun, LadRunOptions } from './run';
import { parseInfo } from './info-parser';

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

  private getDefaultCommand() {
    return 'export PATH+=":/LADAPPs/OpenMPI/openmpi-4.1.1/bin:/LADAPPs/ladscripts:"';
  }

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
    const whoamiResponse = await this.gradSsh.execCommand('whoami');
    const user = whoamiResponse.code === 0 ? whoamiResponse.stdout : 'ERROR'
    this.connected = true;
    this.emit('grad_connected', { user });
    this.emit('connected');
  }

  async exec(command: string, options?: (SSHExecOptions & { stream?: "stdout" | "stderr" | undefined; }) | undefined) {
    this.ensureConnected();
    return this.gradSsh!.execCommand(`${this.getDefaultCommand()};${command}`, options);
  }

  async getFile(localFile: string, remoteFile: string) {
    this.ensureConnected();
    return this.gradSsh!.getFile(localFile, remoteFile);
  }

  async putFile(localFile: string, remoteFile: string) {
    this.ensureConnected();
    return this.gradSsh!.putFile(localFile, remoteFile);
  }

  async compile(isCpp: boolean, omp: boolean, mpi: boolean, inputPath: string, outputPath: string) {
    const compiler = isCpp ? (mpi ? 'mpiCC' : 'g++') : (mpi ? 'mpicc' : 'gcc');
    const flags = omp ? '-fopenmp' : ''; 
    const input = escape(inputPath);
    const output = escape(outputPath);
    return this.exec(`${compiler} ${flags} -o "${output}" "${input}"`);
  }

  run(options: LadRunOptions) {
    return new LadRun(this, options)
  }

  async info() {
    const result = await this.exec('ladinfo', {
      execOptions: {
        pty: true,
      },
    });
    if (result.code !== 0) return;
    const output = result.stdout;
    return parseInfo(output);
  }
}
