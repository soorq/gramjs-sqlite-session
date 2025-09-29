declare module 'better-sqlite3' {
	interface Database {
		exec(sql: string): this;
		prepare(sql: string): Statement;
		close(): void;
	}

	interface Statement {
		run(...params: any[]): this;
		get(...params: any[]): any;
		all(...params: any[]): any[];
	}

	class BetterSqlite3 {
		constructor(databasePath: string, options?: any);
		exec(sql: string): this;
		prepare(sql: string): Statement;
		close(): void;
	}

	export default BetterSqlite3;
}
