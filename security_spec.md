# Security Specification for PrivateVault

## Data Invariants
1. A note must always be linked to a valid `userId` (the owner).
2. Users can only read, update, or delete notes where `userId` matches their `auth.uid`.
3. User profiles can only be created by the authenticated user with a matching `id`.
4. User profiles are immutable once created (except for allowed fields if any).
5. Timestamps (`createdAt`, `updatedAt`) must be strictly server-validated.

## The Dirty Dozen Payloads (Injection Attempts)

1. **Identity Spoofing**: Attempting to create a note with someone else's `userId`.
2. **Shadow Field Injection**: Attempting to inject a `isVerified: true` field into a user profile.
3. **Ghost Update**: Attempting to change the `userId` (ownership) of an existing note.
4. **ID Poisoning**: Creating a note with a 1.5KB document ID string.
5. **PII Leakage**: Authenticated User B attempting to read User A's private profile data.
6. **Time Travel**: Providing a client-side `createdAt` timestamp from 1970.
7. **Size Attack**: Sending a 1MB string for a note `title`.
8. **Blanket Read Scam**: Requesting all user profiles without filtering by ownership.
9. **No-Verify Write**: Attempting to write without a verified email (if required).
10. **State Shortcutting**: Skipping authentication checks by hitting the Firestore SDK directly.
11. **Type Poisoning**: Sending a boolean for the `content` field (expected string).
12. **Orphaned Record**: Creating a note for a `userId` that does not exist in the `users` collection.

## Test Strategy
- Use `firestore.rules` to block all above payloads.
- Verify with `isValidId()` for path variables.
- Enforce `affectedKeys().hasOnly()` for updates.
- Use `request.time` for all timestamps.
