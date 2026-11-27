# Shared Admin storage

The live Admin uses /api/admin to save data/site-config.json and uploaded files to UmeAfk/VastuChitra on main. Public pages read this shared configuration before rendering. Every save is a GitHub commit; media remains in Git history if deleted. Local PC Admin continues using the existing Node server.

## Required Vercel Production environment variables

- GITHUB_TOKEN: fine-grained GitHub token restricted to this repository with Contents read/write.
- ADMIN_PASSWORD: a dedicated strong password for live Admin. Never put either value in source control or browser JavaScript.

Redeploy after adding variables. The live login uses a signed, secure HttpOnly session cookie. Without these variables, shared writes fail explicitly instead of pretending a browser-only draft was published.

Images uploaded from live Admin are resized to 1920px and converted to WebP in the browser. Hosted uploads are capped at 3MB after conversion to fit the serverless request limit. Add larger videos through GitHub. The API only writes the fixed config file or media under public/uploads; deletion is restricted to approved public media directories and protects references in the shared configuration. Concurrent config edits use GitHub file revisions and reject conflicting saves.

Admin project cards support click to select, Shift-click ranges, Ctrl/Cmd-click toggling, and bulk deletion. Reordering remains on the launcher.
