# MotoGearSouq Launch Checklist

## Pre-launch (blocking — no launch without these)

### Deploy
- [ ] Vercel project created and connected to ELSAAD repo
- [ ] DATABASE_URL set in Vercel (optional for launch — email-only is fine)
- [ ] RESEND_API_KEY set in Vercel (required for contact form to work)
- [ ] CONTACT_EMAIL_TO set in Vercel (where to send notifications)
- [ ] CONTACT_EMAIL_FROM set in Vercel (default: onboarding@resend.dev)

### Real content (from client — CRITICAL)
- [ ] Real phone number (not 01000000000)
- [ ] Real WhatsApp number (international format: 201XXXXXXXXX)
- [ ] Real email address
- [ ] At least 1 real branch address + phone (delete or hide others)
- [ ] Real logo SVG (replacing the "E" letter mark)
- [ ] At least 3 real photos for gallery (or hide the gallery section)
- [ ] Real testimonials OR hide testimonials section
- [ ] Confirm brand names in the "Brands" section are accurate

### Legal
- [ ] Privacy policy reviewed by client
- [ ] Terms reviewed by client

### Testing (on production URL)
- [ ] Contact form → email arrives at CONTACT_EMAIL_TO
- [ ] Contact form → invalid phone shows error
- [ ] Contact form → valid phone shows success
- [ ] WhatsApp button opens wa.me with correct number
- [ ] Phone button opens tel: dialer with correct number
- [ ] All branches show real info
- [ ] Mobile view (phone): every section readable
- [ ] OG preview: share URL on WhatsApp → image + title appear
- [ ] Page speed: <3s on 3G (use Chrome DevTools throttling)

## Post-launch (within first week)
- [ ] Google Analytics showing traffic
- [ ] Meta Pixel firing PageView events
- [ ] Monitor contact form spam (add rate-limit if needed)
- [ ] Add real photos as client provides them

## Next phase (not blocking launch)
- [ ] Database enabled (DATABASE_URL) for order persistence
- [ ] Product catalog (Phase 2B)
- [ ] Cart + checkout (Phase 2C)
- [ ] Admin dashboard (Phase 2D)
