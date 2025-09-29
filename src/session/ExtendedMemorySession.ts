import { MemorySession } from 'telegram/sessions';

export class ExtendedMemorySession extends MemorySession {
	private _customEntities: Map<number, any> = new Map();

	getEntityById(id: number): any {
		return this._customEntities.get(id);
	}

	setEntity(id: number, entity: any): void {
		this._customEntities.set(id, entity);
	}

	get entitiesMap(): Map<number, any> {
		return this._customEntities;
	}

	clearEntities(): void {
		this._customEntities.clear();
	}

	hasEntity(id: number): boolean {
		return this._customEntities.has(id);
	}

	deleteEntity(id: number): boolean {
		return this._customEntities.delete(id);
	}

	getAllEntities(): any[] {
		return Array.from(this._customEntities.values());
	}

	getEntityId(entity: any): number | undefined {
		for (const [id, ent] of this._customEntities.entries()) {
			if (ent === entity) {
				return id;
			}
		}
		return undefined;
	}
}
