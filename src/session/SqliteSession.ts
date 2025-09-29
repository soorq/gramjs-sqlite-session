import { ExtendedMemorySession } from './ExtendedMemorySession.js';
import { DatabaseManager } from '../utils/database.js';
import { FileExportManager } from '../utils/file-export.js';
import { SessionManager } from '../manager/session-manager';

/**
 * SQLite-based session storage for GramJS Telegram client
 *
 * @example
 * ```typescript
 * import { TelegramClient } from "telegram";
 * import { SqliteSession } from "telegram-sqlite-session";
 *
 * const session = new SqliteSession("./sessions.db", "my_bot");
 * const client = new TelegramClient(session, apiId, apiHash);
 *
 * await client.start({
 *   phoneNumber: async () => "+1234567890",
 *   phoneCode: async () => "123456"
 * });
 * ```
 */
export class SqliteSession extends ExtendedMemorySession {
	private db: any = null;
	private isLoaded: boolean = false;
	private readonly databasePath: string;
	private readonly sessionName: string;

	private sessionData: {
		authKey?: any;
		dcId?: number;
		serverAddress?: string;
		port?: number;
	} = {};

	/**
	 * Creates a new SQLite session instance
	 * @param databasePath - Path to SQLite database file
	 * @param sessionName - Unique name for this session (default: "default")
	 *
	 * @example
	 * ```typescript
	 * // Single session
	 * const session = new SqliteSession("./sessions.db", "main");
	 *
	 * // Multiple sessions in same database
	 * const session1 = new SqliteSession("./sessions.db", "user1");
	 * const session2 = new SqliteSession("./sessions.db", "user2");
	 * ```
	 */
	constructor(databasePath: string, sessionName: string = 'default') {
		super();
		this.databasePath = databasePath;
		this.sessionName = sessionName;
	}

	private init() {
		if (!this.db) {
			this.db = DatabaseManager.createDatabase(this.databasePath);
			DatabaseManager.ensureTable(this.db);
		}
		return this.db!;
	}

	/**
	 * Loads session data from SQLite database
	 * @returns Promise that resolves when session is loaded
	 * @throws {Error} If database connection fails
	 *
	 * @example
	 * ```typescript
	 * await session.load();
	 * console.log('Session loaded successfully');
	 * ```
	 */
	async load(): Promise<void> {
		if (this.isLoaded) return;

		const db = this.init();
		const row = DatabaseManager.loadSessionData(db, this.sessionName);

		if (row) {
			if (row.auth_key && row.auth_key.length > 0) {
				const { AuthKey } = await import('telegram/crypto/AuthKey');
				this.sessionData.authKey = new AuthKey();
				await this.sessionData.authKey.setKey(row.auth_key);
			}

			if (row.dc_id) {
				this.sessionData.dcId = row.dc_id;
				this.sessionData.serverAddress = row.server_address || '';
				this.sessionData.port = row.port || 443;
			}

			if (row.entities) {
				try {
					const entities = JSON.parse(row.entities);
					for (const [key, value] of Object.entries(entities)) {
						this.setEntity(parseInt(key), value);
					}
				} catch (e) {
					// Silent fail for entities parsing
				}
			}
		}

		this.isLoaded = true;
	}

	/**
	 * Saves current session data to SQLite database
	 * @returns Session name
	 *
	 * @example
	 * ```typescript
	 * const savedName = session.save();
	 * console.log(`Session "${savedName}" saved`);
	 * ```
	 */
	save(): string {
		const db = this.init();
		const authKey = this.sessionData.authKey?.getKey?.() || null;
		const entities =
			this.entitiesMap.size > 0 ? JSON.stringify(Object.fromEntries(this.entitiesMap)) : null;

		DatabaseManager.saveSessionData(db, this.sessionName, {
			authKey,
			dcId: this.sessionData.dcId || null,
			serverAddress: this.sessionData.serverAddress || null,
			port: this.sessionData.port || null,
			entities,
		});

		return this.sessionName;
	}

	/**
	 * Sets the Data Center (DC) information for this session
	 * @param dcId - Data Center ID
	 * @param serverAddress - Server address
	 * @param port - Server port
	 *
	 * @example
	 * ```typescript
	 * session.setDC(2, "149.154.167.40", 443);
	 * ```
	 */
	setDC(dcId: number, serverAddress: string, port: number): void {
		this.sessionData.dcId = dcId;
		this.sessionData.serverAddress = serverAddress;
		this.sessionData.port = port;
		this._saveToDB();
	}

	/**
	 * Gets the authentication key for this session
	 */
	get authKey() {
		return this.sessionData.authKey;
	}

	/**
	 * Sets the authentication key for this session
	 * Automatically saves to database
	 */
	set authKey(value: any) {
		this.sessionData.authKey = value;
		this._saveToDB();
	}

	/**
	 * Sets an entity (user, chat, channel) in the session
	 * @param id - Entity ID
	 * @param entity - Entity object
	 *
	 * @example
	 * ```typescript
	 * session.setEntity(123456789, {
	 *   _: 'user',
	 *   id: 123456789,
	 *   username: 'username'
	 * });
	 * ```
	 */
	setEntity(id: number, entity: any): void {
		super.setEntity(id, entity);
		this._saveToDB();
	}

	private _saveToDB(): void {
		if (!this.isLoaded) return;
		this.save();
	}

	/**
	 * Exports session to a .session file
	 * @param filePath - Path where to save the session file
	 * @returns Path to the exported file
	 *
	 * @example
	 * ```typescript
	 * const exportedPath = session.exportToFile("./backup.session");
	 * console.log(`Session exported to: ${exportedPath}`);
	 * ```
	 */
	exportToFile(filePath: string): string {
		const authKey = this.sessionData.authKey;
		let authKeyHex: string | null = null;

		if (authKey && typeof authKey.getKey === 'function') {
			try {
				const keyBuffer = authKey.getKey();
				if (keyBuffer && typeof keyBuffer.toString === 'function') {
					authKeyHex = keyBuffer.toString('hex');
				}
			} catch (error) {
				// Silent fail
			}
		}

		const sessionData = {
			dc_id: this.sessionData.dcId || 0,
			server_address: this.sessionData.serverAddress || '',
			port: this.sessionData.port || 443,
			auth_key: authKeyHex,
			entities: Object.fromEntries(this.entitiesMap),
			exported_at: new Date().toISOString(),
		};

		return FileExportManager.exportToFile(filePath, sessionData);
	}

	/**
	 * Imports session from a .session file
	 * @param filePath - Path to the session file to import
	 * @returns Promise that resolves when import is complete
	 * @throws {Error} If file doesn't exist or is invalid
	 *
	 * @example
	 * ```typescript
	 * await session.importFromFile("./backup.session");
	 * console.log('Session imported successfully');
	 * ```
	 */
	async importFromFile(filePath: string): Promise<void> {
		const data = FileExportManager.importFromFile(filePath);

		if (data.auth_key) {
			const { AuthKey } = await import('telegram/crypto/AuthKey');
			this.sessionData.authKey = new AuthKey();
			await this.sessionData.authKey.setKey(Buffer.from(data.auth_key, 'hex'));
		}

		this.sessionData.dcId = data.dc_id;
		this.sessionData.serverAddress = data.server_address;
		this.sessionData.port = data.port;

		this.clearEntities();
		for (const [key, value] of Object.entries(data.entities)) {
			this.setEntity(parseInt(key), value);
		}

		this.save();
	}

	/**
	 * Deletes this session from the database
	 * @returns Promise that resolves when session is deleted
	 *
	 * @example
	 * ```typescript
	 * await session.delete();
	 * console.log('Session deleted');
	 * ```
	 */
	async delete(): Promise<void> {
		SessionManager.deleteSession(this.databasePath, this.sessionName);
		this.isLoaded = false;
	}

	/**
	 * Closes the database connection
	 *
	 * @example
	 * ```typescript
	 * session.close();
	 * ```
	 */
	close(): void {
		if (this.db) {
			this.db.close();
			this.db = null;
		}
	}

	/**
	 * Gets information about the current session
	 * @returns Session information object
	 *
	 * @example
	 * ```typescript
	 * const info = session.getSessionInfo();
	 * console.log(`Session: ${info.name}, DC: ${info.dcId}, Has auth: ${info.hasAuth}`);
	 * ```
	 */
	getSessionInfo(): any {
		return {
			name: this.sessionName,
			dcId: this.sessionData.dcId || 0,
			hasAuth: !!this.sessionData.authKey,
			entitiesCount: this.entitiesMap.size,
		};
	}

	/**
	 * Lists all sessions in a database
	 * @param databasePath - Path to SQLite database
	 * @returns Array of session information objects
	 *
	 * @example
	 * ```typescript
	 * const sessions = SqliteSession.listSessions("./sessions.db");
	 * sessions.forEach(session => {
	 *   console.log(`Session: ${session.name}, Created: ${session.created_at}`);
	 * });
	 * ```
	 */
	static listSessions = DatabaseManager.listSessions;

	/**
	 * Deletes a session from the database
	 * @param databasePath - Path to SQLite database
	 * @param sessionName - Name of session to delete
	 *
	 * @example
	 * ```typescript
	 * SqliteSession.deleteSession("./sessions.db", "old_session");
	 * ```
	 */
	static deleteSession = SessionManager.deleteSession;

	/**
	 * Checks if a session exists in the database
	 * @param databasePath - Path to SQLite database
	 * @param sessionName - Name of session to check
	 * @returns True if session exists
	 *
	 * @example
	 * ```typescript
	 * const exists = SqliteSession.sessionExists("./sessions.db", "my_session");
	 * console.log(`Session exists: ${exists}`);
	 * ```
	 */
	static sessionExists = SessionManager.sessionExists;

	/**
	 * Gets information about a specific session
	 * @param databasePath - Path to SQLite database
	 * @param sessionName - Name of session
	 * @returns Session information or { exists: false } if not found
	 *
	 * @example
	 * ```typescript
	 * const info = SqliteSession.getSessionInfo("./sessions.db", "my_session");
	 * if (info.exists) {
	 *   console.log(`Last updated: ${info.updated_at}`);
	 * }
	 * ```
	 */
	static getSessionInfo = SessionManager.getSessionInfo;
}
