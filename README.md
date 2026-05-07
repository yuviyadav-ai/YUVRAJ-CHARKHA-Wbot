# Insurance WORLD — WhatsApp Bot System

## Kya kya hoga is system mein:
- ✅ WhatsApp Chatbot (24/7 auto replies)
- ✅ Bulk Messaging (CSV se contacts, ek click mein sab ko message)
- ✅ Birthday Wishes (auto, daily)
- ✅ Festival Greetings (auto)
- ✅ Admin Dashboard (browser se manage karo)
- ✅ Zero monthly cost

---

## Step 1 — Supabase Setup (already done)

SQL run karo Supabase SQL Editor mein:

```sql
create table contacts (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  phone text not null unique,
  birthday date,
  insurance_type text,
  city text,
  created_at timestamp default now()
);

create table message_log (
  id uuid default gen_random_uuid() primary key,
  phone text,
  message text,
  type text,
  sent_at timestamp default now()
);

create table festivals (
  id uuid default gen_random_uuid() primary key,
  name text,
  date date,
  message_template text
);

insert into festivals (name, date, message_template) values
('Diwali', '2025-10-20', 'Namaste {name} Ji! Diwali ki shubhkamnayein! — Yuvraj Charkha, Insurance WORLD'),
('Holi', '2026-03-14', 'Namaste {name} Ji! Holi mubarak! — Yuvraj Charkha, Insurance WORLD'),
('New Year', '2026-01-01', 'Namaste {name} Ji! Naye saal ki shubhkamnayein! — Insurance WORLD');
```

---

## Step 2 — GitHub pe push karo

```bash
# GitHub pe naya repo banao: "insurance-world-bot"
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TERA_USERNAME/insurance-world-bot.git
git push -u origin main
```

---

## Step 3 — Vercel Deploy

1. vercel.com → Login with GitHub
2. "New Project" → insurance-world-bot select karo
3. Environment Variables add karo:

```
NEXT_PUBLIC_SUPABASE_URL = https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJxxx...
EVOLUTION_API_URL = https://YOUR_KOYEB_APP.koyeb.app
EVOLUTION_API_KEY = your_key
EVOLUTION_INSTANCE = insurance-world
ADMIN_PASSWORD = InsuranceWorld@2024
```

4. Deploy karo → URL milega jaise: insurance-world-bot.vercel.app

---

## Step 4 — Koyeb pe Evolution API

1. koyeb.com → Login
2. "New Service" → Docker
3. Image: `atendai/evolution-api:latest`
4. Port: 8080
5. Environment:
```
AUTHENTICATION_API_KEY = InsuranceWorld@2024
AUTHENTICATION_TYPE = apikey
```
6. Deploy → URL copy karo → Vercel mein EVOLUTION_API_URL update karo

---

## Step 5 — WhatsApp Connect

1. Dashboard open karo (vercel URL)
2. "Connect WhatsApp" button click karo
3. QR code scan karo us number se jis pe bot chalana hai
4. Connected! ✅

---

## Step 6 — Webhook set karo

Evolution API mein webhook set karna hai:
```
URL: https://YOUR_VERCEL_URL.vercel.app/api/webhook
Events: messages.upsert
```

Ye Koyeb dashboard ya Evolution API settings mein milega.

---

## CSV Format

```csv
name,phone,birthday,insurance_type,city
Rahul Kumar,9876543210,15/08/1990,term,Nagpur
Priya Singh,9765432109,22/03/1988,health,Mumbai
```

---

## Done! System live hai 🎉
