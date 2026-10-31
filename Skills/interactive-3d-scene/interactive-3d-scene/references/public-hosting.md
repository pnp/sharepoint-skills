# Public hosting

Sometimes the same scene should also run on a public website, a blog or a conference page. Outside SharePoint there is no host to inject Babylon.js, so the public page has to load it itself. Make that a **separate copy**. The SharePoint file must never contain a CDN URL, because the viewer blocks external scripts and the file would fail its own checks.

## Make the public copy
1. Copy the finished SharePoint file to a new name, for example `scene-public.html`.
2. Replace the manifest line with a pinned, specific version of Babylon.js from a CDN you trust, with Subresource Integrity:

```html
<!-- Public copy only. Never in the SharePoint file. -->
<script src="https://cdn.jsdelivr.net/npm/babylonjs@<version>/babylon.js"
        integrity="sha384-<hash of that exact file>"
        crossorigin="anonymous"></script>
```

   - Pin an exact version (for example `8.x.y`), never `latest` or a range, so the page cannot change under you.
   - Generate the integrity hash from the exact file you tested, for example `curl -sL <url> | openssl dgst -sha384 -binary | openssl base64 -A`.
   - Test the copy with the same version that your tenant's viewer injects, if you can find it in `/_html/llms.txt`, so both behave the same.
3. Keep everything else identical: the inline script, the SVG fallback, sound off by default, and demo mode. If the CDN is blocked or slow, the page shows the drawing, exactly as in SharePoint.
4. Add a `<noscript>` line and a short page description in `<meta name="description">`.

## Serve it safely
- Serve over HTTPS.
- Add a policy that allows only that CDN, for example:
  `Content-Security-Policy: default-src 'none'; script-src 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; base-uri 'none'; form-action 'none'`
- Babylon.js is licensed under Apache-2.0. Keep its licence header in the file it loads, and credit it on the page if your site lists third-party software.
- Do not add analytics, cookies or embeds to a page that people reach from an internal link unless your organisation has approved them.

## Keep the two copies in step
- Treat the SharePoint file as the source of truth. Regenerate the public copy from it after every change, by swapping one line.
- Run the same test matrix on both: [fallback-and-performance.md](fallback-and-performance.md).
- Name the files clearly (`scene.html` for SharePoint, `scene-public.html` for the web), so nobody uploads the public one to a library by mistake.

## Before publishing
Publishing is visible to everyone. Ask the user to confirm the destination, the URL and that the content is approved for public release before uploading anything.
