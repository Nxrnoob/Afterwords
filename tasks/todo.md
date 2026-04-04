# Enhancement Tasks

- [x] 1. Dashboard Welcome
  - [x] Extract name/email in `dashboard/page.tsx` and render personalized greeting.
- [x] 2. Beneficiary Selection
  - [x] Add `getContacts` action.
  - [x] Update `AddItemClientWrapper` to fetch and display contacts in a dropdown instead of raw text input.
- [ ] 3. User-Centric Settings (Edge Cases)
  - [x] Add `timezone` and `isPaused` to `VaultSetting` in DB schema. Run migration.
  - [x] Add Timezone selector and Emergency Pause toggle to Settings UI.
  - [x] Update `updateSettings` server action to accept new fields.
- [x] 4. Actual Email Dispatch
  - [x] Update `cron/trigger/route.ts` to skip processing if `isPaused` is true.
  - [x] Update `cron/trigger/route.ts` to call `sendEmail` for Warning 1, Warning 2, and Vault Release.
  - [x] Ensure Vault Release properly decrypts content and emails specific beneficiaries.
- [x] 5. Blockchain Storage Pipeline (IPFS)
  - [x] Database Schema updates (StorageProvider)
  - [x] Pinata upload integration (`src/lib/ipfs.ts`)
  - [x] AddItem UI storage selector
