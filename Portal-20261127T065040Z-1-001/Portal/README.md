# SocCom Finance Portal

A responsive financial recordkeeping portal for the Committee on Social Communications of the Parish and Archdiocesan Shrine of San Isidro Labrador, Cuenca, Batangas.

## What is included

- Dashboard with cash-fund totals, purpose-based donation pools, and monthly activity chart.
- Separate entry screens for cash and in-kind donations, income, disbursements, expenses, and returns/reimbursements.
- Sequential, year-specific document numbers allocated atomically by PostgreSQL.
- Printable transaction documents. **Download PDF** opens the browser print dialog; select **Save as PDF**.
- Administrator-editable templates for all seven receipt types, including a live actual-receipt preview, printed titles, field labels, footer text, block ordering, individually selectable text, per-text font sizes, and mm-based positioning applied to printed receipts.
- System settings for the organization logo and Finance Officer / Audit Officer names; the organization logo appears in the sidebar and receipts, and settings are shared through Supabase.
- Helvetica-first system typography with bold headings and receipt titles; Arial remains a fallback on systems without Helvetica installed.
- Standard donation, income, disbursement, cash return, and reimbursement documents print on 8.5 × 5.5-inch half-short bond paper. Longer receipts automatically use 8.5 × 11-inch short bond paper and continue across pages as needed.
- Receipt signatories are identified by office: Finance Officer for Prepared by/Received by and Audit Officer for Checked by. Approval is optional unless required for an authorized overdraw.
- Cash donation receipts follow the supplied landscape template, including the parish and configured organization logos, receipt details, signature names, and thank-you footer.
- Income/collection receipts use the supplied official-receipt layout, with automatic amount-in-words, payment details, particulars, and prepared/checked/approved signatures.
- Disbursement vouchers follow the supplied landscape template and support multiple particulars lines with an automatically summed total.
- Expense records use a portrait letter-size template with payee, activity/project, dated expense lines, optional OR/receipt numbers, an automatic total, and prepared/checked/approved/received signatories.
- Cash return and reimbursement records use separate landscape templates. Cash returns calculate the unused amount from funds received less actual expenses; reimbursement particulars are itemized and totaled.
- In-kind donation receipts follow the supplied landscape template and support multiple supply rows, each with a quantity, pcs/box/pack unit, description, and optional estimated value.
- Daily, monthly, annual, and custom-period financial reports with transaction-type filters, editable introductions, full-summary and transactions-only Excel-readable `.xls` downloads.
- Searchable transaction history and administrator-managed donation and income/collections categories and user roles.
- Supabase-backed username/password sign-in, unique usernames, and Admin, Staff, Audit, and Finance Officer roles with database-enforced permissions.
- Supabase Auth password recovery by email, with a portal form to set and confirm a replacement password.
- Documents History under Management to search, filter, view, and reprint saved transaction documents.
- Donation-purpose renaming keeps linked historical donations and fund references together.
- Income-category changes are reflected in the Income / Collections receipt form and dashboard; renaming also updates matching historical income records.
- Required Supabase Auth, Postgres Row Level Security, realtime updates, audit records, and private receipt storage.

## Run locally

The front end is static and needs no package install or build step, but it requires a configured Supabase project. Complete the [Supabase setup](#supabase-setup), including `supabase-config.js`, before launching it. There is no local/demo data mode or offline transaction storage.

From this folder, run a local static server, for example:

```powershell
py -m http.server 8000
```

Then open `http://localhost:8000`. If the Python launcher is unavailable, use another static file server. Opening `index.html` directly may prevent the Supabase ES module from loading; use an HTTP server instead. If Supabase is not configured, sign-in and account requests remain disabled and the portal asks the user to contact the administrator.

## Supabase setup

1. Create a Supabase project and keep its database password and service-role key private.
2. In **SQL Editor**, run the complete [`supabase.sql`](./supabase.sql) script as the project owner.
3. In **Authentication → Providers**, enable email/password sign-in and public sign-ups. Configure email confirmation, password recovery, and production SMTP to match parish policy. In **Authentication → URL Configuration**, set the production **Site URL** and add the app's local development origin under **Redirect URLs** (for example, `http://localhost:8000/**` when using the server above, or the exact origin and port shown by Live Server). Sign-up redirects confirmation to the origin currently serving the app, so keep that server running when clicking the email link; do not use `file://`. Passwords are managed by Supabase Auth and are never stored in the portal's finance tables.
4. Bootstrap the first portal administrator from SQL Editor, replacing the email with the invited account:

   ```sql
   update public.profiles
   set role = 'admin',
       username = 'financeadmin'
   where email = 'finance-admin@example.org';
   ```

5. From a terminal with the Supabase CLI linked to this project, deploy the username sign-in function: `supabase functions deploy username-login`. The function uses Supabase's server-side `SUPABASE_SERVICE_ROLE_KEY` environment variable to look up usernames. Keep that key in Supabase's function environment only; **never put it in the browser app**.
6. Before deployment, set `supabaseUrl` and `supabaseAnonKey` in [`supabase-config.js`](./supabase-config.js). These are browser-visible public connection values; database access must be protected by Supabase Auth and Row Level Security. Never put a `service_role` or secret key in this file; keep it only in trusted server-side Supabase secrets. Serve the app over HTTPS (for example with a static host), then sign in using the bootstrap username and the password set through Supabase Auth.
7. Users can choose **Request an account** on the sign-in page and submit their name, email, and password. Supabase Auth handles the password and any configured email verification. New profiles receive the `pending` role and cannot read financial records, upload receipts, or sign in to the portal until approved. In **User Management**, an admin reviews the request, assigns a unique username and authorized role, then saves the account. The user can then sign in with that username and their Supabase Auth password. Admins can also invite users through Supabase **Authentication → Users**; invited profiles also start pending. For testing, create a separate non-production Auth user and approve it with username `socmed1879` and the Staff role; set its password through Supabase Auth and disable or remove the account after testing. The portal does not include a shared debug password or send approval requests to an administrator email address.
8. Test the policies, outflow approval rules, storage, username sign-in, and real-time updates with non-production sample records before recording actual financial data. Enable backups and restrict project access.

To set or replace a user's password, open the portal sign-in page and choose **Forgot password?**. Enter the email address tied to that Supabase Auth account, open the emailed link using the same allowed app origin, then enter and confirm the new password. If the link opens an error, check the project's **Authentication → URL Configuration → Redirect URLs** and request a fresh link.

If Supabase was configured before the updated income categories, shared portal settings/templates, `CR`/`RB` document prefixes, disbursement, expense, cash return/reimbursement, multi-item in-kind, optional approval forms, or username and role changes were added, rerun the current `supabase.sql` setup script before using those features. The script changes the default role for new profiles to `pending` and moves unassigned profiles still on the previous default Audit role to pending. Review existing roles in **User Management** after migration. Existing Treasurer and Approver roles are migrated to Staff and Finance Officer; existing Viewer accounts remain read-only.

### Roles

| Role | Read records | Create records | Approve overdrawn outflow | Manage users/categories/settings |
|---|---:|---:|---:|---:|
| Audit | Yes, including audit log | No | No | No |
| Staff | Yes | Yes | No | No |
| Finance Officer | Yes | Yes | Yes, with an approval name recorded | No |
| Admin | Yes, including audit log | Yes | Yes, with an approval name recorded | Yes |
| Pending approval | No | No | No | No |

Authorization is enforced by database functions and Row Level Security, not just by hiding interface controls. Only `create_transaction` can insert ledger records. Staff and Finance Officers can create records; only Finance Officers and Admins can approve overdrawn outflows. Only Admins can edit templates, system settings, categories, usernames, and user roles. Audit users can read financial records and the most recent 1,000 audit events.

## Accounting behavior

- Overall cash funds = recorded income + cash donations. In-kind estimated values are non-cash and excluded.
- Each cash donation purpose has a separate balance pool; income uses its own pool.
- Expenses and reimbursements paid reduce their selected pool. A low/negative balance requires an approver or admin and a non-empty `Approved by` name.
- Cash return forms record actual expenses for documentation and post only the calculated unused-funds return; enter those expenses separately under Expenses to update the fund balance.
- Disbursement vouchers are authorization records, not expenses; they do not reduce balances.
- Cash returns add money back to their selected pool. They are not income.
- Previously recorded liquidation reports, if present, remain historical supporting documents and do not post expenses or cash returns. Record actual expenses and returns separately to avoid double counting.
- Document counters are independent by document type and transaction year: Cash Donation `CDR`, In-Kind Donation `IDR`, Income `IR`, Disbursement `DV`, Expense `ER`, Cash Return `CR`, and Reimbursement `RB` (for example `CDR-2026-001`). The year follows the transaction date; an atomic counter and database uniqueness constraint prevent duplicates. Previously issued `CRR` numbers remain on historical records.

## Reports and documents

Date range and transaction-type filters use transaction dates and transaction types. Filter reports to expenses, cash donations, in-kind donations, income/collections, disbursements, cash returns, or reimbursements. Use **Download transactions** to export only the filtered records, or **Download summary Excel** for the report data. An optional introduction appears at the top of the generated report before its transaction details. In **Management → Documents History**, use **Print** beside any saved record to open its print dialog again. For PDF output choose **Save as PDF** in the browser print dialog.

Excel exports use an HTML-based `.xls` workbook that opens in Excel and common spreadsheet applications without a third-party JavaScript dependency.

## Operational notes

- The application loads the Supabase JavaScript client from jsDelivr and requires an internet connection to access Supabase.
- The front end fetches up to 5,000 most recent records. For larger ledgers, implement pagination and report aggregation in PostgreSQL before production use.
- Receipt uploads accept PDF, JPEG, PNG, and WebP up to 10 MB in the private `finance-receipts` bucket. Receipt paths are recorded with their transaction; retrieval/signing is intended for a future document-review workflow.
- This is a technical starter, not a substitute for parish accounting policies, independent financial review, or jurisdiction-specific privacy and retention requirements.
