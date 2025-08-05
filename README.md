---
title: cases
emoji: 🐳
colorFrom: gray
colorTo: green
sdk: static
pinned: false
tags:
  - deepsite
---

Check out the configuration reference at https://huggingface.co/docs/hub/spaces-config-reference

## Content Security Policy

To allow the reCAPTCHA iframe to load, ensure your hosting platform sends the following header:

```
Content-Security-Policy: frame-ancestors 'self' https://www.google.com https://www.gstatic.com;
```

This policy mirrors the meta tag included in `auth.html`.
