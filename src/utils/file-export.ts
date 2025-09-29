import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import type { ExportedSession } from '../types/base.js';

export class FileExportManager {
	static exportToFile(filePath: string, sessionData: ExportedSession): string {
		const dir = dirname(filePath);
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}

		writeFileSync(filePath, JSON.stringify(sessionData, null, 2));
		return filePath;
	}

	static importFromFile(filePath: string): ExportedSession {
		if (!existsSync(filePath)) {
			throw new Error(`Session file not found: ${filePath}`);
		}

		const data = JSON.parse(readFileSync(filePath, 'utf8'));

		if (typeof data.dc_id !== 'number') {
			throw new Error('Invalid session file: missing dc_id');
		}

		return data as ExportedSession;
	}

	static validateSessionData(data: any): data is ExportedSession {
		return (
			typeof data.dc_id === 'number' &&
			typeof data.server_address === 'string' &&
			typeof data.port === 'number' &&
			(data.auth_key === null || typeof data.auth_key === 'string') &&
			typeof data.entities === 'object'
		);
	}
}
