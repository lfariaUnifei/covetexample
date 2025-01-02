import 'module-alias/register';

import dotenv from 'dotenv';
import fs from 'fs';
import os from 'os';

const existsEnvFile = fs.existsSync('.env');

if (!existsEnvFile) {
  const envArray = Object.keys(process.env).reduce((acc, key) => {
    const canAdd = key.includes('APP');
    if (canAdd) acc.push(`${key}="${process.env[key]}"`);

    return acc;
  }, [] as string[]);
  fs.writeFileSync('.env', envArray.join(os.EOL));
}

dotenv.config({ multiline: true });
fs.copyFileSync('.env', 'build/.env');

const packageJson = JSON.parse(fs.readFileSync('package.json').toString());
packageJson._moduleAliases = {
  '@': 'build',
};
if (process.env.NODE_ENV === 'production') {
  fs.writeFileSync('package.json', JSON.stringify(packageJson, undefined, 2));
}
fs.writeFileSync(
  'build/package.json',
  JSON.stringify(packageJson, undefined, 2),
);

process.env = {
  ...process.env,
};
