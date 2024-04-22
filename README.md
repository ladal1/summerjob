# Aplikace pro dobrovolnickou brigádu SummerJob

Webová aplikace pro organizaci SummerJob, vyvíjená jako diplomová práce a později rozšířená v rámci bakalářské práce na FIT ČVUT v Praze.

## DEV Instalace a první spuštění

Potřebné nástroje:

- [docker-compose](https://docs.docker.com/compose/)
- [npm + node + npx](https://www.npmjs.com/)
  - _Při instalaci npm na Ubuntu si dejte pozor na verzi. Při instalaci přes `apt install npm` se stáhne zastaralá verze node.js pro tento projekt. Doporučuji postupovat dle [tohoto návodu](https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-wsl#install-nvm-nodejs-and-npm)._

### Kořenová složka projektu

- Přejmenujte soubor `.env.sample` na `.env`.
- V souboru `docker-compose.yaml` zakomentujte části týkající se **summerjob-web**, **summerjob-planner** a **summerjob-amqp**.
- Spusťte kontejnery:
  ```console
  [summerjob]$ docker-compose up -d
  ```

### Složka `web`

- Přejmenujte soubor `.env.sample` na `.env`.
- Nainstalujte závislosti:
  ```console
  [summerjob/web]$ npm ci
  ```
- Nechte si vygenerovat databázi:
  ```console
  [summerjob/web]$ npx prisma generate
  ```
- Tuhle databázi pak použijte do aplikace:
  ```console
  [summerjob/web]$ npx prisma db push
  ```
- Vytvořte si administrátorský účet (_POZN: Vytvořeným emailem se budete přihlašovat._):
  ```console
  [summerjob/web]$ npm run create-admin
  ```
- Můžete spustit aplikaci:
  ```console
  [summerjob/web]$ npm run dev
  ```

## Spuštění a zastavování

- Spusťte kontejnery:
  ```console
  [summerjob]$ docker-compose up -d
  ```
- Spusťte aplikaci:
  ```console
  [summerjob/web]$ npm run dev
  ```
- Zastavte aplikaci (_CTRL + C_)

  ```console
  [summerjob/web]$ ^C
  ```

- Zastavte kontejnery:
  ```console
  [summerjob]$ docker-compose down
  ```

Aplikace defaultně běží na adrese: http://localhost:3000 .

## Časté problémy

### API handler should not return a value, received object.

Pokud se v konzoli vypisuje toto, poté co se pokusíte přihlásit a email je korektní:

```console
API handler should not return a value, received object.
```

Zkuste v prohlížeči smazat údaje o prohlížení resp. cookies.

---

## Instalace a první spuštění - pův. znění

Potřebné nástroje:

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

### Složka `web`

Sestavte docker image pro web a pro pomocné nástroje (nastavení databáze):

```console
[repo/web]$ docker build -t summerjob/web .
[repo/web]$ docker build -t summerjob/scripts -f Dockerfile.scripts .
```

### Složka `planner`

Sestavte docker image pro Plánovač:

```console
[repo/planner]$ docker build -t summerjob/planner .
```

### Kořenová složka projektu

Vytvořte soubor `.env` [Specifikace docker](https://docs.docker.com/compose/environment-variables/set-environment-variables/) a spusťte kontejnery pomocí docker-compose:

```console
[web]$ docker compose up -d
```

### Nastavení databáze

Do databáze je nutné propsat schéma a vytvořit první administrátorský účet. K tomu je možné využít dříve vytvořený image `summerjob/scripts`. Ve složce `scripts` přejmenujte soubor `docker-compose.yaml.sample` na `docker-compose.yaml` a upravte jej nastavením `DATABASE_URL` na stejnou hodnotu jako v předchozím kroku.
Následně spusťte kontejner a proveďte vytvoření schématu. Poté spusťte příkaz na vytvoření prvního administrátorského účtu:

```console
[scripts]$ docker compose run --rm summerjob-scripts
/app# npx prisma db push
/app# npm run create-admin
Průvodce vytvořením prvního administrátorského účtu
Zadejte ...

/app# exit
```

Databáze si pamatuje data i po restartu kontejneru, takže krok výše je potřeba provést pouze jednou.

Aplikace je nyní dostupná na adrese `http://localhost:3000`.

## Spouštění a zastavování

Pro spuštění a zastavování aplikace je možné použít příkazy `docker compose`:

```console
[web]$ docker compose up -d
```

```console
[web]$ docker compose down
```

Aplikace běží na adrese `http://localhost:3000`.

## Procházení databáze

Pro inspekci databáze je možné použít například aplikaci pgAdmin. Databáze je ve výchozím nastavení dostupná pouze v docker síti, pro připojení je tedy nutné připojit nový kontejner se správcovskou aplikací do stejné sítě (`summerjob-network`) nebo v souboru `docker-compose.yaml` otevřít potřebné porty.

Pokud chceme pouze zobrazit a upravit data v tabulkách, je možné použít nástroj [Prisma Studio](https://www.prisma.io/studio). Pro jeho spuštění lze využít kontejner `summerjob-scripts` ze složky `scripts` a použít příkaz na spuštění Prisma Studio:

```console
[scripts]$ docker compose run --rm --service-ports summerjob-scripts
/app# npx prisma studio
Prisma Studio is running at http://localhost:5555 ...
```

Prisma Studio je nyní dostupné na adrese `http://localhost:5555`.

Pokud běží aplikace na vzdáleném systému, kde není vhodné otevírat porty, je možné využít SSH tunelování. V tomto případě je potřeba vytvořit SSH tunel na port 5555 a poté spustit Prisma Studio, na které se následně půjde připojit lokálně:

```console
[local]$ ssh -L 5555:<remote-host>:5555 <remote-user>@<remote-host>
[remote/repo/scripts]$ docker compose run --rm --service-ports summerjob-scripts
/app# npx prisma studio
Prisma Studio is running at http://localhost:5555 ...
```

## Troubleshooting

### Poskytovatel e-mailů zablokoval odesílání

Při odesílání většího množství e-mailů může dojít k dosažení limitu poskytovatele a následnému dočasnému zablokování odesílání. V takovém případě se není možné přihlásit do aplikace přes webové rozhraní a v logu kontejneru se objeví chyba odesílání, typicky `451`.

Aby se tomuto problému předešlo, nastavuje se platnost přihlášení na 30 dní, což pokryje celé trvání ročníku SummerJobu.

Pokud by však bylo nutné přihlásit administrátora či člena týmu a není možné počkat na uvolnění limitu (obvykle desítky minut až jednotky hodin), je možné provést nouzové vygenerování nové session cookie:

```console
[scripts]$ docker compose run --rm summerjob-scripts
root@<container-id>:/app# npm run create-session
Zadejte email: admin@example.cz
Session token vytvořen:
  Název cookie: session-token
  Hodnota cookie: <session-token>
  ...
```
