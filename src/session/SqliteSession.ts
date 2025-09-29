import { ExtendedMemorySession } from './ExtendedMemorySession.js';
import { DatabaseManager } from '../utils/database.js';
import { FileExportManager } from '../utils/file-export.js';
import { SessionManager } from '../manager/session-manager';

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

	setDC(dcId: number, serverAddress: string, port: number): void {
		this.sessionData.dcId = dcId;
		this.sessionData.serverAddress = serverAddress;
		this.sessionData.port = port;
		this._saveToDB();
	}

	get authKey(): any {
		return this.sessionData.authKey;
	}

	set authKey(value: any) {
		this.sessionData.authKey = value;
		this._saveToDB();
	}

	setEntity(id: number, entity: any): void {
		super.setEntity(id, entity);
		this._saveToDB();
	}

	private _saveToDB(): void {
		if (!this.isLoaded) return;
		this.save();
	}

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
				// Игнорируем ошибки при получении ключа
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

	async delete(): Promise<void> {
		SessionManager.deleteSession(this.databasePath, this.sessionName);
		this.isLoaded = false;
	}

	close(): void {
		if (this.db) {
			this.db.close();
			this.db = null;
		}
	}

	getSessionInfo(): any {
		return {
			name: this.sessionName,
			dcId: this.sessionData.dcId || 0,
			hasAuth: !!this.sessionData.authKey,
			entitiesCount: this.entitiesMap.size,
		};
	}

	// Static methods
	static listSessions = DatabaseManager.listSessions;
	static deleteSession = SessionManager.deleteSession;
	static sessionExists = SessionManager.sessionExists;
	static getSessionInfo = SessionManager.getSessionInfo;
}
