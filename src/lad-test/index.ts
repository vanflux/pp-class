import 'dotenv/config';
import { Lad, LadConfigHelper } from '../lad-lib';

async function main() {
  const config = LadConfigHelper.fromEnv();

  const lad = new Lad();
  lad.on('connecting', () => console.log('[SSH] Connecting to sparta (sometimes this could take 1-2 minutes)'));
  lad.on('sparta_connected', () => console.log('[SSH] Forwarding grad'));
  lad.on('grad_forwarded', () => console.log('[SSH] Connected to sparta'));
  lad.on('grad_connected', ({ user }) => console.log('[SSH] Connected as', user));
  await lad.connect(config);
  const allocation = await lad.alloc();
  allocation.exec('time echo 123');
  allocation.exec('exit');
  allocation.end();
  console.log('Output:', await allocation.getOutput());
  console.log('Info:', await lad.info());
}

main();
