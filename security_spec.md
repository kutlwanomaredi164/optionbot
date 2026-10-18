# Security Specification: SelectBot Universal Platform

## 1. Data Invariants

1. **User Identity Invariant**: A user profile at `/users/{userId}` can only be read, created, or updated by the authenticated user whose `request.auth.uid == userId`. Users cannot elevate their own role or spoof identities.
2. **Workspace Ownership Invariant**: A workspace at `/workspaces/{workspaceId}` cannot be created without setting `ownerId` to `request.auth.uid`. The `ownerId` and `createdAt` are immutable after creation.
3. **Chatbot Relational Sync & Master Gate**: Every chatbot document at `/chatbots/{botId}` must belong to a valid owner (`ownerId == request.auth.uid`). Subcollections (`knowledge`, `handoffRequests`, `actionSubmissions`) inherit authorization strictly from the parent chatbot.
4. **Public vs Private Read Access**: Chatbots in `published` status allow public unauthenticated read access so website embed widgets can display the bot to end customers. Unpublished/draft chatbots are strictly accessible only by the owning authenticated user.
5. **No Blanket Reads or Client Delegation**: All collection queries evaluate `resource.data` directly. Blanket reads such as `allow list: if isSignedIn()` are strictly prohibited.
6. **Input Boundary Hardening**: All IDs must satisfy `isValidId(id)` (alphanumeric with hyphens/underscores, maximum 128 chars). String fields must enforce strict `.size()` constraints preventing wallet exhaustion.
7. **Action Integrity**: Action submissions and handoff requests require valid parent chatbot references, strict keys (`hasOnly`), and prevent retroactive status tampering.

---

## 2. The "Dirty Dozen" Payloads

The following 12 attack vectors are specifically designed to test and break Identity, Integrity, and State boundaries:

1. **D1: User Profile Spoofing (Identity Hijack)**:
   - Attempting to create `/users/victim_user_123` with `request.auth.uid = "attacker_456"`.
   - Expected: `PERMISSION_DENIED`.

2. **D2: Privilege Escalation (Self-Promoted Admin)**:
   - Sending `{ role: "admin" }` or `{ role: "superadmin" }` during standard user profile creation.
   - Expected: `PERMISSION_DENIED`.

3. **D3: Shadow Fields Injection on Workspace**:
   - Sending an extra shadow field `{ name: "HQ", ownerId: "uid", isEnterprisePaid: true }`.
   - Expected: `PERMISSION_DENIED` via `hasOnly()` gate.

4. **D4: Immutable Field Tampering (Stealing a Workspace)**:
   - Sending an update to `/workspaces/ws_abc` changing `ownerId: "attacker_456"`.
   - Expected: `PERMISSION_DENIED`.

5. **D5: Draft Bot Scraping (Unpublished Intellectual Property Leak)**:
   - Unauthenticated `GET` or `LIST` on `/chatbots/draft_bot_private` when `status == "draft"`.
   - Expected: `PERMISSION_DENIED`.

6. **D6: ID Poisoning / Buffer Overflow Attack**:
   - Attempting to write to `/chatbots/` with a document ID of 2,000 characters.
   - Expected: `PERMISSION_DENIED` via `isValidId()`.

7. **D7: Massive Text Flood (Denial of Wallet)**:
   - Sending a chat message with a 500,000 character payload to exhaust Firestore storage quota.
   - Expected: `PERMISSION_DENIED` via `incoming().text.size() <= 4000`.

8. **D8: Orphaned Subcollection Write (Knowledge Base Injection)**:
   - User `attacker_456` attempting to add a knowledge base entry into `/chatbots/victim_bot_999/knowledge/item_1`.
   - Expected: `PERMISSION_DENIED` via Master Gate check `get(/databases/$(database)/documents/chatbots/$(botId)).data.ownerId == request.auth.uid`.

9. **D9: Status Tampering on Resolved Handoff**:
   - Attempting to update a handoff request whose state is already `resolved` back to `new`.
   - Expected: `PERMISSION_DENIED` via terminal state locking.

10. **D10: Temporal Spoofing (Forged Timestamps)**:
    - Sending a client-forged timestamp string or past date instead of server timestamp `request.time`.
    - Expected: `PERMISSION_DENIED`.

11. **D11: Cross-Tenant Action Submission Modification**:
    - Unauthenticated or unauthorized user attempting to delete or edit an interactive form submission in `/chatbots/{botId}/actionSubmissions/{submissionId}`.
    - Expected: `PERMISSION_DENIED`.

12. **D12: Unauthenticated Knowledge Tampering**:
    - Anonymous web visitor attempting to delete or alter business knowledge items.
    - Expected: `PERMISSION_DENIED`.

---

## 3. Test Runner Design

The integration test suite in `firestore.rules.test.ts` validates that each of the Dirty Dozen payloads fails with `PERMISSION_DENIED` using the `@firebase/rules-unit-testing` framework pattern.
