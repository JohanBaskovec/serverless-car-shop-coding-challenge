import * as dotenv from 'dotenv';
import * as path from 'node:path';

export function initializeEnvironmentVariables(): void {
    const env = process.env.CODING_CHALLENGE_ENV ?? 'dev';
    const dotenvPath = path.join(__dirname, `../../config/.env.${env}`);
    dotenv.config({
        path: dotenvPath
    });
}
