# Supabase Local Development Setup

### 1. Generate Signing Keys

Run the following command:

```bash
supabase gen signing-key
```

Save the generated key to `supabase/signing_keys.json`

### 2. Update Config

Update your `supabase/config.toml` with the new keys path:

```toml
[auth]
signing_keys_path = "./signing_keys.json"
```

### 3. Generate Bearer JWT Token for Local Dev

Run the following command to generate a token:

```bash
supabase gen bearer-jwt --role service_role --payload "{\"iss\": \"http://127.0.0.1:54341/auth/v1\", \"aud\": \"authenticated\"}" --valid-for "5256000m"
```

```bash
supabase gen bearer-jwt --role authenticated --sub 00000000-0000-4000-8000-000000000001 --payload "{\"iss\": \"http://127.0.0.1:54341/auth/v1\", \"aud\": \"authenticated\"}" --valid-for "10m" --yes
```

Example token:

```
eyJhbGciOiJFUzI1NiIsImtpZCI6IjI0MzBjZDk4LTNlYzAtNDRmMS1hODQ5LWFhNTdiM2UxYThlYiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vMTI3LjAuMC4xOjU0MzIxL2F1dGgvdjEiLCJzdWIiOiI5MThiYWQ0My03YTdhLTQzM2MtYTNjOS0xMzYyZGRkYjVhMjEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzcyODIyOTA2LCJpYXQiOjE3NzIyMTgxMDYsImVtYWlsIjoiZmFoeWlrQGljbG91ZC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImFwcGxlIiwicHJvdmlkZXJzIjpbImFwcGxlIl19LCJ1c2VyX21ldGFkYXRhIjp7ImN1c3RvbV9jbGFpbXMiOnsiYXV0aF90aW1lIjoxNzcyMjE4MTA1fSwiZW1haWwiOiJmYWh5aWtAaWNsb3VkLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmYW1pbHlfbmFtZSI6IllvbmciLCJmdWxsX25hbWUiOiJGYWggWWlrIFlvbmciLCJnaXZlbl9uYW1lIjoiRmFoIFlpayIsImlzcyI6Imh0dHBzOi8vYXBwbGVpZC5hcHBsZS5jb20iLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInByb3ZpZGVyX2lkIjoiMDAwMDkxLjZkYzRiNDEwZTdmZTQwM2RhM2Y4MDVmZGExNDViYmFmLjEzMzgiLCJzdWIiOiIwMDAwOTEuNmRjNGI0MTBlN2ZlNDAzZGEzZjgwNWZkYTE0NWJiYWYuMTMzOCJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6Im9hdXRoIiwidGltZXN0YW1wIjoxNzcyMjE4MTA2fV0sInNlc3Npb25faWQiOiJkNzBhZjhjMS0yZTQ3LTRmNjMtYTE2NC1iMmZkYmJhZTA5OWMiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.tRNweLqvNACp-tsaf9VkuthYb4nlXd3jg1rMrbFf1CO_GZaLnRYYNdJ2dfpHhx3C1TfekOrYGUILjhB-oPfjpw
```

## Running Migrations

For local instance run the following commands to apply or revert migrations:
Be extremely CAREFUL when running migration down, as it would clear all existing data in the database.

```bash
supabase migration up
supabase migration down
```

## Supabase Local Env Values

```bash
npx supabase status -o env
```
