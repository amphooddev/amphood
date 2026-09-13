/* Makes a fresh amp wallet and writes it straight into amp/.env. Prints ONLY the address.
   The private key is never printed. It lives in .env on this machine, which git ignores. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
const here = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(here, '.env');
if (fs.existsSync(envPath) && /amp_PRIVATE_KEY=0x[0-9a-fA-F]{64}/.test(fs.readFileSync(envPath, 'utf8'))) {
  const addr = fs.readFileSync(envPath, 'utf8').match(/amp_ADDRESS=(0x[0-9a-fA-F]{40})/);
  console.log('a amp wallet already exists in .env:', addr ? addr[1] : '(address line missing)'); console.log('delete .env first if you really want a new one.'); process.exit(0);
}
const pk = generatePrivateKey(); const a = privateKeyToAccount(pk);
fs.writeFileSync(envPath, `# the amp wallet. never share this file.\namp_PRIVATE_KEY=${pk}\namp_ADDRESS=${a.address}\n`, { mode: 0o600 });
console.log('amp wallet created. address:', a.address);
console.log('key written to amp/.env (git-ignored). Back that file up somewhere private.');
console.log('send about 0.01 ETH on Robinhood Chain to the address for gas.');
