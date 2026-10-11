# Architecture rules

- Treat `clientes` as the hub of each mentoring journey; related financial records, tasks, meetings, analyses and events must use `cliente_id` so history remains isolated and auditable.
- Shared client access is authorized only by database row-level rules; frontend visibility checks never grant access.
- Keep Pessoa Física and Pessoa Jurídica explicit on every client record and never infer the profile from document formatting.
- Scope public-site visual tokens under `.public-site` so editorial redesigns never change the authenticated financial workspace.
- Serve signup gift PDFs from private storage with a database-validated confirmed-email read policy; the library stays accessible independently of subscription status because the gifts are free.
- Keep the administrative assistant behind server-verified admin roles, use caller-scoped read-only tools, and persist its single conversation privately per administrator; service access only manages the validated user's transcript and AI pause state.
- Store reviewed client statement entries in the client journey ledger using cliente_id and the client's explicit profile, so both PF and PJ statements appear in the same auditable client history.
