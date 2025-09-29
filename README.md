# @gramjs/sqlite-session

SQLite session storage for GramJS Telegram client.

## Installation

```bash
npm install @gramjs/sqlite-session
```

## Usage

```typescript
import { TelegramClient } from 'telegram';
import { SqliteSession } from '@gramjs/sqlite-session';

const session = new SqliteSession('./sessions.db', 'my_session');
const client = new TelegramClient(session, apiId, apiHash);

await client.start({
	phoneNumber: async () => '+1234567890',
	phoneCode: async () => '12345',
});
```

## Features

-   ✅ Persistent session storage
-   ✅ Multiple sessions support
-   ✅ Export/import to .session files
-   ✅ Automatic entity caching
