// src/config/sslConfig.ts

import fs from 'fs';
import path from 'path';

export const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, 'ssl', 'server.key')),
  cert: fs.readFileSync(path.join(__dirname, 'ssl', 'server.cert')),
  ca: fs.readFileSync(path.join(__dirname, 'ssl', 'ca.cert'))
};
