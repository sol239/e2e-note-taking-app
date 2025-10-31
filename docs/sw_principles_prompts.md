# 📝 Seznam principů pro AI kódování

---

## **1️⃣ OOP – Objektově orientované programování**

| Princip           | Popis                                                    | Prompt / Tip pro AI                                                                        |
| ----------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Encapsulation** | Skrytí interního stavu objektu, přístup jen přes metody. | „Použij zapouzdření – všechny vlastnosti třídy soukromé, přístup přes get/set metody.“     |
| **Abstraction**   | Skrývá implementační detaily, vystavuje jen podstatné.   | „Vytvoř abstraktní třídu nebo rozhraní pro hlavní logiku a specifické implementace odděl.“ |
| **Inheritance**   | Opakované použití kódu skrze dědičnost.                  | „Použij dědičnost tam, kde nové entity rozšiřují chování základní třídy.“                  |
| **Polymorphism**  | Stejné rozhraní, různé implementace.                     | „Umožni polymorfismus, aby různé objekty měly stejnou metodu, ale různou implementaci.“    |

---

## **2️⃣ SOLID principy**

| Princip | Popis                                                | Prompt / Tip pro AI                                                                    |
| ------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **SRP** | Jedna třída → jedna odpovědnost.                     | „Rozděl kód tak, aby každá třída měla jen jednu zodpovědnost.“                         |
| **OCP** | Otevřené pro rozšíření, uzavřené pro změny.          | „Umožni přidávat nové funkce bez změny existujícího kódu.“                             |
| **LSP** | Potomek může nahradit rodiče bez chyb.               | „Zajisti, aby dědičné třídy mohly nahradit základní třídu bez porušení funkcionality.“ |
| **ISP** | Malá, specifická rozhraní.                           | „Rozděl velká rozhraní na menší, aby třídy implementovaly jen to, co potřebují.“       |
| **DIP** | Závislost na abstrakcích, ne na konkrétních třídách. | „Použij rozhraní nebo abstrakce místo přímé závislosti na konkrétních třídách.“        |

---

## **3️⃣ Clean Code (čistý kód)**

| Princip                 | Popis                                     | Prompt / Tip pro AI                                                   |
| ----------------------- | ----------------------------------------- | --------------------------------------------------------------------- |
| Smysluplné názvy        | Jasné názvy funkcí, proměnných a tříd.    | „Použij názvy, které přesně popisují účel proměnné nebo metody.“      |
| Funkce dělají jednu věc | Funkce by měly být krátké a jednoúčelové. | „Funkce by měla dělat jen jednu věc, název popisuje přesně, co dělá.“ |
| DRY                     | Neopakuj kód.                             | „Vyvaruj se duplikace, opakovaný kód dej do funkce/metody.“           |
| KISS                    | Jednoduchost.                             | „Zvol nejjednodušší řešení, vyhni se zbytečně složité logice.“        |
| YAGNI                   | Nepřidávej funkce, které nejsou potřeba.  | „Nepřidávej extra funkce, které teď nejsou využity.“                  |
| Boy Scout Rule          | Zanech kód čistší, než jsi ho našel.      | „Uprav kód tak, aby byl čistší a čitelnější.“                         |
| Error handling          | Ošetřuj chyby, ale nezahlcuj logiku.      | „Zachytávej chyby jasně a elegantně, kód zůstane čitelný.“            |

---

## **4️⃣ Další principy / best practices**

| Princip                           | Popis                                      | Prompt / Tip pro AI                                                              |
| --------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------- |
| **Separation of Concerns**        | Oddělení různých logických částí.          | „Rozděl kód podle odpovědnosti – logika, UI, databáze samostatně.“               |
| **Law of Demeter**                | Objekt komunikuje jen se svými „přáteli“.  | „Nepřistupuj k interním objektům jiných objektů přímo, používej metody objektu.“ |
| **Composition over Inheritance**  | Preferuj skládání objektů před dědičností. | „Použij skládání tříd místo hluboké dědičnosti, když je to možné.“               |
| **Fail Fast**                     | Chyby zachytit co nejdřív.                 | „Detekuj chyby hned při vstupu/metodě, ne až později.“                           |
| **Immutability**                  | Neměnné objekty.                           | „Používej neměnné objekty tam, kde stav nemusí měnit.“                           |
| **TDD (Test-Driven Development)** | Testy před implementací.                   | „Napiš testy před implementací nové funkce.“                                     |

---
