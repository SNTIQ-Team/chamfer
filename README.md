# SNTIQ Chamfer

Draft letters to German authorities and courts, find the recipient, and export to PDF or DOCX.

[Open Chamfer](https://sntiq.com/dt/chamfer)

## From situation to letter

For matters involving temporary protection under § 24 AufenthG, select the situation and the German state, then complete the relevant fields. The templates produce a German letter. The interface is available in German, English, Russian and Ukrainian. Find the recipient by place through SNTIQ Taper or enter an address manually.

The templates and preview run in the browser. You can copy the letter text or prepare an email. When you request a PDF or DOCX, the browser sends the composed letter to the rendering service at `POST /chamfer/letter`. Filing with an authority or court happens outside this application.

## Local development

Use Node.js 22.13 or later. From the repository root, run:

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). The root path redirects to `/dt/chamfer`.

```sh
npm test
npm run typecheck
npm run lint
npm run build
npm start
```

## Configuration

Set these variables before building to use your own endpoints.

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_TAPER_API_BASE_URL` | `https://api.sntiq.com/taper` | Place, authority and court lookup |
| `NEXT_PUBLIC_CHAMFER_API_BASE_URL` | `https://api.sntiq.com/chamfer` | PDF and DOCX rendering |

The public services accept browser requests from `http://localhost:3000`. For another origin, use endpoints configured to accept that origin. [Taper and Chamfer services](https://github.com/SNTIQ-Team/taper)

## Licensing

SNTIQ software uses Apache-2.0. SNTIQ’s original documentation and editorial material use CC BY 4.0. Third-party material and fonts retain their own terms. [Apache license](LICENSE) · [Source notices and licensing](LICENSING.md)
