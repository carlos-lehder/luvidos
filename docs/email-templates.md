# Supabase Email Templates for Luvidos

Copy-paste these into **Supabase Dashboard → Authentication → Email Templates**.

---

## 1. Confirm Signup

**Subject:** `Confirm your Luvidos account`

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body
    style="margin:0;padding:0;background-color:#1a1020;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;"
  >
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      style="background-color:#1a1020;padding:40px 16px;"
    >
      <tr>
        <td align="center">
          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            style="max-width:480px;background-color:#2a1f35;border-radius:16px;overflow:hidden;"
          >
            <!-- Header -->
            <tr>
              <td
                style="background:linear-gradient(135deg,#F0ABFC,#A21CAF);padding:32px 32px 24px;text-align:center;"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 64 64"
                  width="48"
                  height="48"
                  style="display:inline-block;"
                >
                  <path
                    fill="#fff"
                    fill-rule="evenodd"
                    d="M32 55C14 42 8 31 12 22c3-7 12-9 17-4l3 3 3-3c5-5 14-3 17 4c4 9-2 20-20 33zM27 27v18l15-9z"
                  />
                </svg>
                <h1
                  style="margin:12px 0 0;font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.5px;"
                >
                  <span style="opacity:0.9;">Luv</span>idos
                </h1>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:32px;">
                <h2
                  style="margin:0 0 8px;font-size:20px;font-weight:600;color:#f5f0f7;"
                >
                  Welcome! 🎉
                </h2>
                <p
                  style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#b8a5c8;"
                >
                  Thanks for signing up for Luvidos. Click the button below to
                  confirm your email and start sharing your media.
                </p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center">
                      <a
                        href="{{ .ConfirmationURL }}"
                        target="_blank"
                        style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#F0ABFC,#A21CAF);color:#fff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;"
                      >
                        Confirm Email
                      </a>
                    </td>
                  </tr>
                </table>
                <p
                  style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#7a6b8a;"
                >
                  If you didn't create an account, you can safely ignore this
                  email.
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td
                style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;"
              >
                <p style="margin:0;font-size:11px;color:#5a4d6a;">
                  © {{ .SiteURL }} · Luvidos — Media Gallery & Streaming
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

---

## 2. Magic Link

**Subject:** `Your Luvidos login link`

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body
    style="margin:0;padding:0;background-color:#1a1020;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;"
  >
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      style="background-color:#1a1020;padding:40px 16px;"
    >
      <tr>
        <td align="center">
          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            style="max-width:480px;background-color:#2a1f35;border-radius:16px;overflow:hidden;"
          >
            <!-- Header -->
            <tr>
              <td
                style="background:linear-gradient(135deg,#F0ABFC,#A21CAF);padding:32px 32px 24px;text-align:center;"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 64 64"
                  width="48"
                  height="48"
                  style="display:inline-block;"
                >
                  <path
                    fill="#fff"
                    fill-rule="evenodd"
                    d="M32 55C14 42 8 31 12 22c3-7 12-9 17-4l3 3 3-3c5-5 14-3 17 4c4 9-2 20-20 33zM27 27v18l15-9z"
                  />
                </svg>
                <h1
                  style="margin:12px 0 0;font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.5px;"
                >
                  <span style="opacity:0.9;">Luv</span>idos
                </h1>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:32px;">
                <h2
                  style="margin:0 0 8px;font-size:20px;font-weight:600;color:#f5f0f7;"
                >
                  Sign in to Luvidos ✨
                </h2>
                <p
                  style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#b8a5c8;"
                >
                  Click the button below to securely sign in to your account.
                  This link expires in 10 minutes.
                </p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center">
                      <a
                        href="{{ .ConfirmationURL }}"
                        target="_blank"
                        style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#F0ABFC,#A21CAF);color:#fff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;"
                      >
                        Sign In
                      </a>
                    </td>
                  </tr>
                </table>
                <p
                  style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#7a6b8a;"
                >
                  If you didn't request this link, you can safely ignore this
                  email.
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td
                style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;"
              >
                <p style="margin:0;font-size:11px;color:#5a4d6a;">
                  © {{ .SiteURL }} · Luvidos — Media Gallery & Streaming
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

---

## 3. Reset Password

**Subject:** `Reset your Luvidos password`

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body
    style="margin:0;padding:0;background-color:#1a1020;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;"
  >
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      style="background-color:#1a1020;padding:40px 16px;"
    >
      <tr>
        <td align="center">
          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            style="max-width:480px;background-color:#2a1f35;border-radius:16px;overflow:hidden;"
          >
            <!-- Header -->
            <tr>
              <td
                style="background:linear-gradient(135deg,#F0ABFC,#A21CAF);padding:32px 32px 24px;text-align:center;"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 64 64"
                  width="48"
                  height="48"
                  style="display:inline-block;"
                >
                  <path
                    fill="#fff"
                    fill-rule="evenodd"
                    d="M32 55C14 42 8 31 12 22c3-7 12-9 17-4l3 3 3-3c5-5 14-3 17 4c4 9-2 20-20 33zM27 27v18l15-9z"
                  />
                </svg>
                <h1
                  style="margin:12px 0 0;font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.5px;"
                >
                  <span style="opacity:0.9;">Luv</span>idos
                </h1>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:32px;">
                <h2
                  style="margin:0 0 8px;font-size:20px;font-weight:600;color:#f5f0f7;"
                >
                  Reset Password 🔒
                </h2>
                <p
                  style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#b8a5c8;"
                >
                  We received a request to reset your password. Click the button
                  below to choose a new one.
                </p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center">
                      <a
                        href="{{ .ConfirmationURL }}"
                        target="_blank"
                        style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#F0ABFC,#A21CAF);color:#fff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;"
                      >
                        Reset Password
                      </a>
                    </td>
                  </tr>
                </table>
                <p
                  style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#7a6b8a;"
                >
                  If you didn't request a password reset, you can safely ignore
                  this email. Your password won't be changed.
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td
                style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;"
              >
                <p style="margin:0;font-size:11px;color:#5a4d6a;">
                  © {{ .SiteURL }} · Luvidos — Media Gallery & Streaming
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

---

## 4. Change Email Address

**Subject:** `Confirm your new email for Luvidos`

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body
    style="margin:0;padding:0;background-color:#1a1020;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;"
  >
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      style="background-color:#1a1020;padding:40px 16px;"
    >
      <tr>
        <td align="center">
          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            style="max-width:480px;background-color:#2a1f35;border-radius:16px;overflow:hidden;"
          >
            <!-- Header -->
            <tr>
              <td
                style="background:linear-gradient(135deg,#F0ABFC,#A21CAF);padding:32px 32px 24px;text-align:center;"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 64 64"
                  width="48"
                  height="48"
                  style="display:inline-block;"
                >
                  <path
                    fill="#fff"
                    fill-rule="evenodd"
                    d="M32 55C14 42 8 31 12 22c3-7 12-9 17-4l3 3 3-3c5-5 14-3 17 4c4 9-2 20-20 33zM27 27v18l15-9z"
                  />
                </svg>
                <h1
                  style="margin:12px 0 0;font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.5px;"
                >
                  <span style="opacity:0.9;">Luv</span>idos
                </h1>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:32px;">
                <h2
                  style="margin:0 0 8px;font-size:20px;font-weight:600;color:#f5f0f7;"
                >
                  Confirm New Email ✉️
                </h2>
                <p
                  style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#b8a5c8;"
                >
                  Click the button below to confirm changing your email address
                  to this one.
                </p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center">
                      <a
                        href="{{ .ConfirmationURL }}"
                        target="_blank"
                        style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#F0ABFC,#A21CAF);color:#fff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;"
                      >
                        Confirm Email Change
                      </a>
                    </td>
                  </tr>
                </table>
                <p
                  style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#7a6b8a;"
                >
                  If you didn't request this change, please secure your account
                  immediately.
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td
                style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;"
              >
                <p style="margin:0;font-size:11px;color:#5a4d6a;">
                  © {{ .SiteURL }} · Luvidos — Media Gallery & Streaming
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```
