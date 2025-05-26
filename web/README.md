# Webová část aplikace SummerJob plánovač

Instrukce pro spuštění aplikace v produkčním režimu se nachází v kořenové složce repozitáře.

## Vývoj

### Adresářová struktura

Použitý framework [Next.js](https://nextjs.org/) ve verzi 13, využívá routing podle adresářů. Stránky zodpovědné za routing se nachází v adresáři `app`. Složky s názvem v kulatých závorkách - `(user)` - se v URL neprojeví a slouží pouze pro organizaci souborů. Složky s názvem v hranatých závorkách - `[id]` - slouží pro předání dynamických parametrů.

Složka `app` využívá Server-side rendering (SSR), takže je možné v těchto stránkách např. získat data z databáze bez nutnosti volání API. Interaktivní stránky, které je potřeba vyrenderovat na klientovi, se nacházejí v adresáři `lib/components` a jsou do serverových stránek importovány.

API se nachází v adresáři `pages/api`. Složka `pages/api` je speciální složka, která také provádí vyhodnocení na serveru. Ostatní složky ve složce `pages` jsou renderované na klientovi. Všechny API endpointy jsou vytvořeny pomocí [Next.js API routes](https://nextjs.org/docs/api-routes/introduction). Všechny API endpointy s výjimkou přihlašování jsou přístupné pouze pro přihlášené uživatele. Tým Next.js v současnosti pracuje na převedení API endpointů do složky `app`, ale pro fungování této aplikace tato změna nemá vliv a obě varianty budou nadále podporovány.

```
/
├── app/                    # Webové stránky
├── lib/
│   ├── api/                # Pomocné soubory pro API
│   ├── auth/               # Pomocné soubory pro ověřování uživatelů
│   ├── components/         # Interaktivní komponenty pro webové stránky (většina obsahu webu)
│   ├── data/               # Spojení s databází, přístup k datům
│   ├── fetcher/            # Funkce pro client-side přístup k API
│   ├── logger/             # Logování
│   ├── prisma/             # Automaticky generované soubory pro přístup k DB pomocí Prisma
│   ├── types/              # Typové definice Zod, TypeScript
├── pages/
│   ├── api/                # API endpointy
│       ├── /auth           # Konfigurace NextAuth.js pro přihlašování
├── prisma/                 # Konfigurace databáze, definice schématu
├── public/                 # Veřejné soubory (favicon, logo)
├── scripts/                # Pomocné skripty pro vývoj nebo první nastavení
├── styles/                 # CSS soubory, importované do komponent
├── test/                   # API testy
```

### Lokální spuštění

Potřebné nástroje navíc:

- [Node.js](https://nodejs.org/en/)
- Databáze (může být v Dockeru)
- Fronta AMQP (např. RabbitMQ v Dockeru)

Přejmenujte soubor `.env.sample` na `.env` ve složce `web` a nastavte všechny potřebné údaje.

Následně nainstalujte závislosti pomocí `npm` a spusťte aplikaci:

```console
[web]$ npm install
[web]$ npm run dev
```

Tento příkaz spustí aplikaci v režimu vývoje, který automaticky restartuje aplikaci po každé změně v kódu. Aplikace je dostupná na adrese `http://localhost:3000`.

Obdobně je možné spustit i Plánovač. Ve složce `planner` přejmenujte `.env.sample` na `.env` a nastavte všechny potřebné údaje stejné jako v `docker-compose.yaml`. Následně je možné program spustit:

```console
[planner]$ npm install
[planner]$ npm run start
```

### Smazání a seedování databáze

Pro smazání databáze je možné použít připravený skript:

```console
[web]$ npm run delete-db
```

Pro seedování jsou k dispozici následující skripty:

- `seed` - Vytvoří 100 uživatelů a přibližně 70 jobů a další potřebná data.
- `seed-mini` - Vytvoří 5 uživatelů, malé množství jobů a další potřebná data.

```console
[web]$ npm run seed
```

### Úprava dat v databázi

Pro úpravu dat v databázi je možné použít nástroj [Prisma Studio](https://www.prisma.io/studio).

```console
[web]$ npx prisma studio
```

### Přihlašování

Během vývoje je zablokováno odesílání e-mailů a uživateli je povoleno přihlášení na libovolnou e-mailovou adresu.

Session cookies se nastavují jako Http Only a není je tedy možné odstranit automaticky, pokud dojde například ke změně dat v databázi. Před přihlášením je tedy nutné smazat cookie `next-auth.session-token` v prohlížeči.

## Testování

Pro spuštění API testů je nutné připravit testovací databázi. Nastavte v souboru `.env` v adresáři `web` proměnnou `DATABASE_URL` na adresu testovací databáze. Tato databáze musí mít stejné schéma jako produkční, ale nesmí obsahovat data. Před každým spuštěním pro smazání dat z testovací databáze lze napsat:

```console
[web]$ npx prisma db push --force-reset
```

Testování probíhá na produkční verzi aplikace.

```console
[web]$ npm run build
[web]$ npm run start
Application is running on http://localhost:3000
```

A nebo lze i na vývojvé verzi aplikace.

```console
[web]$ npm run dev
Application is running on http://localhost:3000
```

V dalším okně terminálu pak můžete spustit testy.

```
[web]$ npm run test
```

Pokud chcete testy opakovat, restartujte aplikaci (kdy před spuštěním smažte data z databáze) a spusťte testy znovu.
