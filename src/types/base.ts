export interface SessionData {
	id?: number;
	name: string;
	auth_key: Buffer | null;
	dc_id: number | null;
	server_address: string | null;
	port: number | null;
	entities: string | null;
	created_at?: string;
	updated_at?: string;
}

export interface SessionInfo {
	name: string;
	dcId: number;
	hasAuth: boolean;
	entitiesCount: number;
}

export interface ExportedSession {
	dc_id: number;
	server_address: string;
	port: number;
	auth_key: string | null;
	entities: Record<string, any>;
	exported_at: string;
}
