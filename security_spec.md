# Security Specifications

This document defines the security boundaries, data invariants, and the "Dirty Dozen" security threat analysis for our QR premises access dashboard system.

## Data Invariants
1. **Immutable Audit Trail:** Once a check-in or check-out is registered under `/access_logs/{logId}`, it cannot be edited, tampered with, or deleted by anyone (including security guards or administrators).
2. **Access Control (RBAC):** Only authenticated users with an `'admin'` role inside `/system_roles` can register, modify, or delete authorized visitors (or other roles). Guards have read-only access to visitors and write-only (create) permissions for logs.
3. **No Guest Exploitation:** Access tokens must match the cryptographically generated QR-token stored inside `authorized_users`. Custom tokens or custom expiration dates cannot be injected by security client interfaces.
4. **Time Boundaries:** No QR code can grant check-in if the current server timestamp is outside of `validFrom` or `validUntil`.

---

## The "Dirty Dozen" Threat Vectors & Rejections (TDD Payload Sandbox)

Below are the 12 adversarial payloads designed to compromise the system, all of which are rejected under our standard secure policies:

1. **Self-Escalation Request (Admin Spoofing):**
   - **Scenario:** A malicious guard account tries to edit their role to `'admin'` to grant access to unauthorized friends.
   - **Vectored Path:** `update` on `/system_roles/attacker_uid` with payload: `{ "role": "admin" }`
   - **Outcome:** `PERMISSION_DENIED` - Self-assigned or modified roles are rejected.

2. **Shadow Visitor Inject (Orphan Write):**
   - **Scenario:** An external user attempts to add themselves to `/authorized_users` with high access parameters without administrator credentials.
   - **Vectored Path:** `create` on `/authorized_users/malicious_entry` with unauthorized token.
   - **Outcome:** `PERMISSION_DENIED` - Requires administrative authentications.

3. **Status Reversal (Force Activate):**
   - **Scenario:** A suspended visitor attempts to modify their own `status` to `'active'` using their browser device.
   - **Vectored Path:** `update` on `/authorized_users/some_visitor` with `{ "status": "active" }`
   - **Outcome:** `PERMISSION_DENIED` - Active visitor updates are restricted to administrators.

4. **Single-Use Guard Bypass (Check-in Forgery):**
   - **Scenario:** A visitor with a used single-use QR-code tries to update the database to set `"used": false` to reuse the screen-capture code.
   - **Vectored Path:** `update` on `/authorized_users/some_visitor` with `{ "used": false }`
   - **Outcome:** `PERMISSION_DENIED` - Only administrators can set `"used"` back to false; guards can only toggle it to `true` during scans.

5. **Log Erasure / Cover-up Logs (Audit Tampering):**
   - **Scenario:** An unauthorized intruder tries to delete their failed entry log to cover their tracks.
   - **Vectored Path:** `delete` on `/access_logs/bad_scan_log_id`
   - **Outcome:** `PERMISSION_DENIED` - Access logs are strictly append-only.

6. **Log Manipulation (Rewriting History):**
   - **Scenario:** A guard tries to change the timestamp or user identifier of an entry to fake an alibi for an associate.
   - **Vectored Path:** `update` on `/access_logs/bad_scan_log_id` with `{ "userName": "Clean Name", "status": "success" }`
   - **Outcome:** `PERMISSION_DENIED` - Write/update privileges are blocked for existing logs.

7. **Email Spoofing / Account Infiltration (Unverified Sign-In):**
   - **Scenario:** An attacker registers with an email representing an admin, but leaves `email_verified` as `false` to exploit blanket email rules.
   - **Vectored Path:** `read` on `/authorized_users` list.
   - **Outcome:** `PERMISSION_DENIED` - We mandate actual email verification triggers or role exists checks.

8. **Resource Exhaustion Attack (Junk ID Injection):**
   - **Scenario:** An attacker tries to write massive strings or non-standard characters as document IDs to pollute indexes.
   - **Vectored Path:** `create` on `/authorized_users/$$__JUNK_ID_SPAM_$$`
   - **Outcome:** `PERMISSION_DENIED` - Protected by ID constraints and `isValidId` validators.

9. **PII Harvesting (Bulk Listing Leak):**
   - **Scenario:** A regular employee wants to copy all visitor Phone numbers, Documents, and emails for external uses.
   - **Vectored Path:** `list` on `/authorized_users` with no guard/admin role.
   - **Outcome:** `PERMISSION_DENIED` - Bulk listing is restricted strictly to active security guards and administrators.

10. **Ghost State Poisoning (Arbitrary Field Spam):**
    - **Scenario:** An attacker uses client-side SDKs to submit a visitor document with arbitrary ghost configurations to blow up memory (e.g. `{ "vipLevel": 9999, "isPresident": true }`).
    - **Vectored Path:** `create` on `/authorized_users/new_item`
    - **Outcome:** `PERMISSION_DENIED` - Checked via strict `keys().hasOnly()` during CRUD validations.

11. **Client-Controlled Access Range Spoofing:**
    - **Scenario:** A user attempts to update their expiration timestamp to some date in the year 2099.
    - **Vectored Path:** `update` on `/authorized_users/userId` with `{ "validUntil": "2099-12-31T23:59:59Z" }`
    - **Outcome:** `PERMISSION_DENIED` - Timestamps updates are administrative-only.

12. **Anonymous Entry Exploits (No Identity Verification):**
    - **Scenario:** An anonymous, unauthenticated browser client tries to query access controls or fetch logs.
    - **Vectored Path:** `list` on `/access_logs`
    - **Outcome:** `PERMISSION_DENIED` - Complete login and guard clearance checks are enforced prior to any query action.
