import { ClientChannel } from 'ssh2';

export class Allocation {
  private buffers: Buffer[] = [];
  private outputPromise: Promise<string>;

  constructor(private channel: ClientChannel) {
    this.outputPromise = new Promise(setOutput => {
      this.channel.stdout.on('data', (buffer: Buffer) => {
        this.buffers.push(buffer);
      });
      this.channel.on('close', async () => {
        const output = String(Buffer.concat(this.buffers));
        setOutput(output);
      });
    });
  }

  async getOutput() {
    return this.outputPromise;
  }
}
