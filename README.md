# SUSA ENTERPRISE — Bakery & Café Franchise Website

Static marketing site for SUSA ENTERPRISE, a turnkey bakery & café franchise brand.

## Stack

- Plain HTML + CSS + vanilla JS (no framework, no build step)
- Site-wide styling in `css/common.css`, shared behaviour in `js/main.js`
- Hosted on Netlify / Vercel
- Optional content management via Turso + Vercel serverless functions (see `api/`)

## Pages

| Path | Purpose |
| --- | --- |
| `index.html` | Home — hero, stats, product lines, gallery, FAQ |
| `about.html` | Brand story |
| `franchise.html` | 4-step franchise application with ₹4,999 registration fee (payment step is Razorpay-ready) |
| `gallery.html` | Store concepts gallery |
| `services.html` | Products & services |
| `contact.html` | Contact + enquiry form + quick links |
| `privacy.html` / `terms.html` / `refund.html` | Legal pages |

## Run locally

```bash
python -m http.server 3000
```

Open http://localhost:3000

## Business details

- Address: 82/6 Shaikh Para Lane, Chatterjee Hat, Howrah, West Bengal 711104, India
- Phone (India): +91 96094 06997
- Phone (KSA): +966 590831351
- Email: hello@susaenterprise.com
- Franchise registration fee: ₹4,999 (one-time, non-refundable)