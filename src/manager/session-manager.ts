import { DatabaseManager } from '../utils/database.js';

export class SessionManager {
	static deleteSession(databasePath: string, sessionName: string): void {
		const db = require('better-sqlite3')(databasePath);
		try {
			DatabaseManager.ensureTable(db);
			DatabaseManager.deleteSessionData(db, sessionName);
		} finally {
			db.close();
		}
	}

	static sessionExists(databasePath: string, sessionName: string): boolean {
		const sessions = DatabaseManager.listSessions(databasePath);
		return sessions.some(session => session.name === sessionName);
	}

	static getSessionInfo(
		databasePath: string,
		sessionName: string,
	): {
		exists: boolean;
		created_at?: string;
		updated_at?: string;
	} {
		const sessions = DatabaseManager.listSessions(databasePath);
		const session = sessions.find(s => s.name === sessionName);

		return session
			? {
					exists: true,
					created_at: session.created_at,
					updated_at: session.updated_at,
			  }
			: { exists: false };
	}
}
