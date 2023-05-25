import EventEmitter from 'events';
import { ClientChannel } from 'ssh2';
import { Readable } from 'stream';

export class Allocation extends EventEmitter {
  private outputPromise: Promise<string>;
  private ended = false;

  constructor(private stdin: Readable, private channel: ClientChannel) {
    super();
    this.outputPromise = new Promise(resolve => {
      const buffers: Buffer[] = [];
      this.channel.stdout.on('data', (buffer: Buffer) => {
        buffers.push(buffer);
      });
      this.channel.on('close', async () => {
        if (!this.ended) {
          this.ended = true;
          this.emit('end');
        }
        const output = String(Buffer.concat(buffers));
        resolve(output);
      });
    });
  }

  async getOutput() {
    return this.outputPromise;
  }

  exec(command: string) {
    if (this.ended) throw new Error('Can\'t execute command, allocation already ended!');
    this.stdin.push(`${command}\n`);
  }

  end() {
    if (!this.ended) {
      this.ended = true;
      this.emit('end');
      this.stdin.push(null);
    }
  }
}
