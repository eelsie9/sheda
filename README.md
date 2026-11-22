# Sheda NG

Sheda is a marketplace where creatives sell products and services, where buyers can save ideas on boards, and where anyone can post a request and let creatives send proposals. Made in Lagos, Nigeria.

## What is in this repository

- `frontend/` is the website (React, Vite and Tailwind CSS).
- Everything else in the main folder is the backend (Node.js, Express, Prisma and a PostgreSQL database on Supabase).

## Run the backend

1. Open a terminal in the main folder.
2. Run `npm install`.
3. Copy `.env.example` to a new file called `.env` and fill in your own database details.
4. Run `npx prisma generate`.
5. Run `npx prisma migrate deploy`.
6. Run `npm run seed` to add demo buyers and sellers.
7. Run `npm run dev`. The backend runs at http://localhost:5000.

## Run the frontend

1. Open a second terminal in the `frontend` folder.
2. Run `npm install`.
3. Run `npm run dev` and open the link it prints.

## Demo accounts

After running the seed, every demo account uses the password `demo1234`.

- Buyer: `tolu@sheda.demo`
- Seller: `adaeze@sheda.demo`

## Features

- Buyer and seller accounts, with easy switching between them
- Marketplace with categories, search and community posts
- Idea boards with a side assistant that recommends creators (verified creators first)
- Public requests, seller proposals and chat
- Seller profiles with portfolios, reviews and a Verified badge