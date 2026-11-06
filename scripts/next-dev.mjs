import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const certPath = path.join(projectRoot, 'certs', 'russian_trusted_root_ca_pem.crt');

if (!process.env.NODE_EXTRA_CA_CERTS && existsSync(certPath)) {
  process.env.NODE_EXTRA_CA_CERTS = certPath;
}

const nextBin = path.join(projectRoot, 'node_modules', 'next', 'dist', 'bin', 'next');

const child = spawn(process.execPath, [nextBin, 'dev', ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: projectRoot,
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
