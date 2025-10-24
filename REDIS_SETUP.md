# Redis Setup Guide

## Installation

### Windows:
1. Download Redis from: https://github.com/microsoftarchive/redis/releases
2. Extract and run `redis-server.exe`
3. Default port: 6379

### macOS:
```bash
brew install redis
brew services start redis
```

### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

## Configuration

1. Install Node.js dependencies:
```bash
npm install
```

2. Update your `.env` file with Redis settings:
```
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
```

3. Start your server:
```bash
npm start
```

## Redis Features Implemented

### User Session Management:
- User login sessions stored in Redis
- Session expiration (24 hours)
- Active user tracking

### Caching:
- User profiles cached for 30 minutes
- User statistics cached for 15 minutes
- Quiz session data cached for 2 hours

### Analytics:
- User activity counters
- Active users list for admin dashboard
- Session tracking with IP and user agent

## Redis Keys Structure:
- `user:session:{userId}` - User session data
- `user:profile:{username}` - Cached user profile
- `user:stats:{username}` - Cached user statistics
- `quiz:session:{userId}` - Active quiz session
- `user:activity:{username}` - Daily activity counter

## Testing Redis Connection:
1. Start Redis server
2. Start your Node.js server
3. Check console for "Connected to Redis server" message
4. Login as a user - session should be stored in Redis
5. Check admin dashboard for active users

## Troubleshooting:
- If Redis is not available, the app will still work but without caching
- Check Redis server is running: `redis-cli ping` (should return PONG)
- Check Redis logs for connection issues