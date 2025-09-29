export class DatabaseManager {
	static createDatabase(databasePath: string): any {
		const Database = require('better-sqlite3');
		return new Database(databasePath);
	}

	static ensureTable(db: any): void {
		db.exec(`
            CREATE TABLE IF NOT EXISTS telegram_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                auth_key BLOB,
                dc_id INTEGER,
                server_address TEXT,
                port INTEGER,
                entities TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
	}

	static loadSessionData(db: any, sessionName: string): any {
		const stmt = db.prepare('SELECT * FROM telegram_sessions WHERE name = ?');
		const row = stmt.get(sessionName);
		return row || null;
	}

	static saveSessionData(
		db: any,
		sessionName: string,
		data: {
			authKey: Buffer | null;
			dcId: number | null;
			serverAddress: string | null;
			port: number | null;
			entities: string | null;
		},
	): void {
		const stmt = db.prepare(`
            INSERT OR REPLACE INTO telegram_sessions
            (name, auth_key, dc_id, server_address, port, entities, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);

		stmt.run(
			sessionName,
			data.authKey,
			data.dcId,
			data.serverAddress,
			data.port,
			data.entities,
		);
	}

	static deleteSessionData(db: any, sessionName: string): void {
		const stmt = db.prepare('DELETE FROM telegram_sessions WHERE name = ?');
		stmt.run(sessionName);
	}

	static listSessions(
		databasePath: string,
	): Array<{ name: string; created_at: string; updated_at: string }> {
		const db = this.createDatabase(databasePath);
		try {
			this.ensureTable(db);
			const stmt = db.prepare(`
                SELECT name, created_at, updated_at
                FROM telegram_sessions
                ORDER BY created_at DESC
            `);
			return stmt.all();
		} finally {
			db.close();
		}
	}
}
