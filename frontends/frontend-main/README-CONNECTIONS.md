# Multiple Connection Support

The frontend now supports multiple backend connections without requiring a connections.json file. The system will work with just the default connection if no additional connections are configured.

## Default Connection

By default, the application uses:
- API URL: `http://localhost:3000` (or from `API_URL` environment variable)
- Socket URL: `ws://localhost:4000` (or from `SOCKET_URL` environment variable)

## Adding Additional Connections

To add additional connections (e.g., staging, production):

1. Create a `connections.json` file in the `frontend/public/` directory
2. Use the following format:

```json
[
  {
    "NAME": "Staging",
    "API_URL": "https://staging-api.example.com",
    "SOCKET_URL": "wss://staging-socket.example.com"
  },
  {
    "NAME": "Production",
    "API_URL": "https://api.example.com",
    "SOCKET_URL": "wss://socket.example.com"
  }
]
```

3. The file will be automatically loaded when the application starts
4. Users can switch between connections using the connection selector in the UI

## Notes

- The `connections.json` file is optional - the app works without it
- The file should be placed in `frontend/public/` so it's served as a static asset
- The file is excluded from git (see `.gitignore`)
- An example file is provided at `frontend/connections.json.example`
- Connections are loaded dynamically at runtime, not at build time