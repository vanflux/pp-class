import 'dotenv/config';
import { Lad } from '../lad-lib';

async function main() {
  const registry = process.env.REGISTRY;
  const groupNumStr = process.env.GROUP;
  const spartaPass = process.env.SPARTA_PASS;
  const gradPass = process.env.GRAD_PASS;
  if (!registry) return console.error('REGISTRY deve existir em secrets.txt');
  if (!groupNumStr) return console.error('GROUP deve existir em secrets.txt');
  if (!spartaPass) return console.error('SPARTA_PASS deve existir em secrets.txt');
  if (!gradPass) return console.error('GRAD_PASS deve existir em secrets.txt');
  if (registry.length !== 8) return console.error('REGISTRY deve ter 8 de tamanho');
  const groupNum = parseInt(groupNumStr);
  if (isNaN(groupNum)) return console.error('GROUP não é um número válido');

  const lad = new Lad();
  lad.on('connecting', () => console.log('[SSH] Connecting to sparta (sometimes this could take 1-2 minutes)'));
  lad.on('sparta_connected', () => console.log('[SSH] Forwarding grad'));
  lad.on('grad_forwarded', () => console.log('[SSH] Connected to sparta'));
  lad.on('grad_connected', ({ user }) => console.log('[SSH] Connected as', user));
  await lad.connect({
    registry,
    groupNum,
    spartaPass,
    gradPass,
  });
  lad.alloc('echo 1\nsleep 1\ndate\nexit\n').then(async allocation => console.log(await allocation.getOutput()));
  lad.alloc('echo 2\nsleep 2\ndate\nexit\n').then(async allocation => console.log(await allocation.getOutput()));
  lad.alloc('echo 3\nsleep 3\ndate\nexit\n').then(async allocation => console.log(await allocation.getOutput()));
  lad.alloc('echo 4\nsleep 4\ndate\nexit\n').then(async allocation => console.log(await allocation.getOutput()));
  console.log(await lad.info());
}

main();
