# telegram-sqlite-session

![npm version](https://img.shields.io/npm/v/@gramjs/sqlite-session.svg)](https://www.npmjs.com/package/@gramjs/sqlite-session)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-≥16-green.svg)](https://nodejs.org/)

A robust SQLite-based session storage solution for GramJS Telegram client. Persist your Telegram sessions across restarts with enterprise-grade reliability.

## ✨ Features

-   🗄️ **Persistent Storage** - Sessions survive application restarts
-   🔄 **Multiple Sessions** - Manage multiple accounts in single database
-   📤 **Export/Import** - Backup and restore `.session` files
-   ⚡ **High Performance** - Built on better-sqlite3
-   🛡️ **Type Safe** - Full TypeScript support
-   🔧 **Automatic Management** - No manual saving required

## Installation

```bash
npm install @gramjs/sqlite-session
```

## 💻 Quick Start

```typescript
import { TelegramClient } from 'telegram';
import { SqliteSession } from '@gramjs/sqlite-session';

// Create session with SQLite backend
const session = new SqliteSession('./sessions.db', 'my_bot');

// Initialize Telegram client
const client = new TelegramClient(session, apiId, apiHash);

// Authenticate (only needed once)
await client.start({
	phoneNumber: async () => '+1234567890',
	phoneCode: async () => await prompt('Enter verification code: '),
	onError: err => console.error(err),
});

// Session is automatically persisted to database!
console.log('✅ Session saved to SQLite database');
```

## 📚 API Reference

## 🎯 Advanced Usage

### Multiple Sessions

```typescript
// Manage multiple accounts
const user1Session = new SqliteSession('./sessions.db', 'user1');
const user2Session = new SqliteSession('./sessions.db', 'user2');

const client1 = new TelegramClient(user1Session, apiId, apiHash);
const client2 = new TelegramClient(user2Session, apiId, apiHash);
```

## 🤝 Contributing

We welcome contributions! Please read our contributing guidelines before submitting pull requests.

### Development Setup

1. Fork the repository
2. Clone your fork

```bash
git clone https://github.com/soorq/telegram-sqlite-session.git
cd telegram-sqlite-session
```

3. Install dependencies

```bash
npm install
```

4. Build the project

```bash
npm run build
```

5. Run in development mode

```bash
npm run dev
```

## 📄 License
MIT © Soorq
