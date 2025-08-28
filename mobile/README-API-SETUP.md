This file explains how to run the mobile app (web or Expo Go) while pointing to a custom API URL (for example a Render-deployed backend).

1. Ensure your `mobile/.env` contains the correct API URL.

EXPO_PUBLIC_API_URL=https://my-wallet-bl80.onrender.com/api

2. For local development with Expo CLI (web):

- If you use `expo start` the bundler will load environment variables from `.env` if your setup supports it (for example with `dotenv` or a custom loader). To be safe, you can pass the env var inline when starting:

# PowerShell (Windows)

$env:EXPO_PUBLIC_API_URL = 'https://my-wallet-bl80.onrender.com/api'
expo start --web

This ensures the web build will use the Render URL as `API_URL`.

3. For Expo Go on your phone:

- Expo Go will load the app bundle served from your machine. For the app to contact the remote Render API you don't need any special host mapping — the app will use the EXPO_PUBLIC_API_URL baked into the bundle when it was started. Start the bundler with the env var like above, then open the project in Expo Go via the QR code.

Example (PowerShell):
$env:EXPO_PUBLIC_API_URL = 'https://my-wallet-bl80.onrender.com/api'
expo start

4. Verify at runtime:

- Open the app (web or Expo Go) and in the app developer console look for debug lines added by the client (see `create.jsx` and `useTransactions.js`): the client logs the resolved `API_URL` and outgoing requests. Create a transaction to ensure the POST hits the Render URL.
- If you see a 429 response, check the response body and the `Retry-After` header. The server will bypass rate-limiting for authenticated requests (requests with `Authorization` or `x-user-id`).

5. If you still see problems:

- Capture the browser/dev-console logs showing the request URL and response (status + body).
- Capture backend logs around the same time — after the recent server edits the create handler logs incoming headers and body when NODE_ENV !== 'production'.

If you want, I can also add a small runtime toast or UI message that shows the app's current `API_URL` on the home screen to make verification easier.
