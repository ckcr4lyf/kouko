import { resolve } from 'path';
import { config } from 'dotenv';

import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));


config({path: resolve(__dirname, '../.env')});