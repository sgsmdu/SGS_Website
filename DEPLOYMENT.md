# SGS website deployment checklist

## 1. Cloudflare Pages
1. In Cloudflare, open Workers & Pages → Create → Pages → Connect to Git.
2. Select sgsmdu/SGS_Website and the main branch after the pull request is reviewed and merged.
3. Framework preset: None. Build command: leave empty. Build output directory: repository root (.).
4. Add both custom domains: sgsmdu.in and www.sgsmdu.in. The included _redirects file redirects www to the apex domain.
5. Enable Always Use HTTPS. Confirm /robots.txt, /sitemap.xml and /sgsadmin5665/ load.

## 2. Google Sheets + Apps Script backend
1. Create a Google Sheet for website enquiries and news posts. Copy its spreadsheet ID from the URL.
2. Open Extensions → Apps Script and paste the repository apps-script.gs into the project.
3. In Project Settings → Script Properties, add SPREADSHEET_ID = your Sheet ID, ADMIN_EMAIL = spidergridsolutions@gmail.com, and optionally DRIVE_FOLDER_ID = your Drive folder ID.
4. Run a function once in the editor and approve the requested Sheets, Gmail and Drive permissions.
5. Deploy as Web app, execute as Me, access Anyone. Public enquiries use this endpoint; admin operations enforce the allowlisted email and OTP session server-side.
6. Update the existing deployment to the latest code while keeping the same /exec URL. If the URL changes, update APPS_SCRIPT_URL in functions/api/[[path]].js.
7. Cloudflare Pages Function proxies requests through same-origin /api. Do not expose the Apps Script URL in browser JavaScript.

## 3. Admin panel
- URL: https://sgsmdu.in/sgsadmin5665/
- Only spidergridsolutions@gmail.com can request an OTP.
- OTP expires after 5 minutes; repeated incorrect codes are limited.
- Uploaded news images are public so they can appear on the website. Do not upload customer documents or private images.

## 4. Google indexing and Madurai local SEO
1. Verify the sgsmdu.in domain property in Google Search Console using DNS verification.
2. Submit https://sgsmdu.in/sitemap.xml.
3. Inspect the home page and each service page in URL Inspection and request indexing after production deployment.
4. Keep Google Business Profile name, address, phone, categories and hours consistent with the website. Add the website URL to the profile.
5. Ask real customers for reviews; never buy or fabricate reviews. Add original photos of actual installations and repair work.
6. Publish useful, original service updates through the admin panel. Keep service descriptions, prices and warranty claims accurate.
7. Confirm current social profile URLs and Google Business Profile link are correct.

## 5. Production checks
- Test OTP delivery, wrong OTP rejection, expiry, post create/delete and public image display.
- Test enquiry form delivery to the Sheet and Gmail, plus click-to-call and WhatsApp on mobile.
- Test navigation at narrow mobile widths and on desktop.
- Run PageSpeed Insights and Search Console Core Web Vitals after deployment.
- Confirm canonical URLs use https://sgsmdu.in/ and www redirects to apex.
- Live Google review cards need a restricted Places API key; without it, the Google Maps/reviews link still works but review cards are not populated.