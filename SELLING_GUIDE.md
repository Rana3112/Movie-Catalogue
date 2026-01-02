# 📦 How to Sell Your Source Code (Starter Kit)

Selling code is a fantastic business. You are selling "Time Saved". Other developers want to build a cool 3D site but don't want to spend weeks figuring out `react-three-fiber` geometry.

Here is your step-by-step checklist to launch this product.

---

## Phase 1: Clean & Package 🧹

Before you sell, you must ensure the code is generic and safe.

1.  **Remove Secrets**:
    *   **NEVER** include your `.env` file or `node_modules` in the zip.
    *   Search your code for any hardcoded API keys (e.g. `const API_KEY = "xyz"`). replace them with `process.env.API_KEY`.
2.  **Create `.env.example`**:
    *   Create a file named `.env.example`.
    *   Add the keys *without* the values, so buyers know what they need.
    ```env
    VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
    MONGODB_URI=your_mongodb_connection_string_here
    ```
3.  **Polish the README**:
    *   We already created a great `README.md`. Ensure the "Installation" section is bullet-proof. Test it yourself by cloning to a new folder and running `npm install`.

## Phase 2: Create the "Product" 🎁

You are selling a **"3D React Movie Catalogue Template"**.

1.  **Screenshots & Video**:
    *   Record a smooth 30-second video of the Year Barrel, the Magic Bento hover effects, and the Calendar drag-and-drop.
    *   Take high-res screenshots of the "My Space" dashboard.
    *   *Visuals sell the code.*
2.  **Live Demo**:
    *   Keep your Vercel link (`your-app.vercel.app`) alive. This is your "Live Preview".
    *   Make a "Demo User" account (e.g., `demo@example.com` / `password123`) so buyers can log in and see the private pages without using their own Google account if they prefer.

## Phase 3: Choose a Platform 🏪

I recommend **Gumroad** or **Lemon Squeezy**. They are beginner-friendly and handle taxes.

*   **Title**: "3D Cinematic Web App Template (React + Three.js)"
*   **Description**:
    > "Build an immersive 3D web experience in minutes. This React + Vite template features a unique cylinder time-travel navigation, glassmorphism UI, and a fully functional drag-and-drop calendar backend. Perfect for portfolios, media sites, or creative agencies."
*   **Price**:
    *   **Standard License**: **$29 - $49** (Personal use / 1 Project)
    *   **Extended License**: **$149** (For commercial use / SaaS)

## Phase 4: Marketing 📣

Where do you find buyers?

1.  **Twitter/X**: Post your video. Tag `@0xca0a` (React Three Fiber creator) or `#threejs` `#reactjs`. "Just built this 3D navigation, selling the template if anyone wants to study the code!"
2.  **Reddit**: Post in `r/webdev` or `r/threejs`. "Showoff Saturday: Built a time-travel movie app. Source code available." (Check rules first!)
3.  **Product Hunt**: Launch it as a developer tool.

---

## 🔒 Legal Tip
Add a simple **License.txt** to your zip file.
*   "You are granted a non-exclusive license to use this code for personal or commercial projects."
*   "You **cannot** resell or redistribute this code 'as is' (i.e., you can't buy my template and sell it as your own template)."

## ❓ Troubleshooting
**Error: "You must connect at least one payment method..."**
*   Gumroad won't let you publish until you tell them **how to pay you**.
*   Go to **Settings** -> **Payouts**.
*   Connect your Bank Account or PayPal.
*   Once done, come back and hit **Publish**!
