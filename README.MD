# Stamina Server

Сервер для демонстрации механики витривалості (stamina) у мобільній грі.  
Реалізовано на **Node.js + TypeScript + Express**, дані зберігаються у локальному `db.json`.

## Запуск
```bash
# 1. Встановити залежності
npm install

# 2. Прямий запуск через ts-node
npm start
```

Сервер стартує на [http://localhost:3000](http://localhost:3000)

## Налаштування
Опційні змінні середовища:

- `MAX_STAMINA` – максимум витривалості (за замовчуванням 5)
- `REFILL_INTERVAL_MS` – інтервал відновлення 1 одиниці у мілісекундах (за замовчуванням 5 хв = 300000)
- `PORT` – порт сервера (за замовчуванням 3000)

Змінювати значення можна у файлі ``.env``

Приклад конфігурації знаходиться у файлі ``.env.example`` в корені проєкту.

## API
### 1. Реєстрація гравця
```
POST /v1/players/register
```
**Відповідь:**
```json
{
  "playerId": "uuid",
  "stamina": 5,
  "maxStamina": 5,
  "nextRefillAt": null,
  "serverTime": 1758018852861
}
```

---

### 2. Отримати поточну витривалість
```
GET /v1/stamina/player/:playerId
```
**Відповідь:**
```json
{
  "stamina": 4,
  "maxStamina": 5,
  "nextRefillAt": 1758019450857,
  "serverTime": 1758019172698
}
```

---

### 3. Старт рівня
```
POST /v1/sessions/start/:playerId
{
  "playerId": "PLAYER_ID"
}
```
- Якщо є відкрита сесія -> 409 Conflict з причиною `open_session_exists`.
- Якщо stamina = 0 -> 409 Conflict з причиною `no_stamina`.

**Успішна відповідь:**
```json
{
  "sessionId": "uuid",
  "staminaBefore": 4,
  "serverTime": 1758019564098
}
```

---

### 4. Завершення рівня
```
POST /v1/sessions/end/:playerId
{
  "sessionId": "SESSION_ID",
  "outcome": "win | lose | restart | exit",
  "idempotencyKey": "optional-string"
}
```
- `lose | restart | exit` -> -1 stamina
- `win` -> stamina не змінюється
- `idempotencyKey` робить виклик ідемпотентним (повторний запит повертає той самий результат).

**Відповідь:**
```json
{
  "stamina": 3,
  "nextRefillAt": 1758019753253,
  "serverTime": 1758019560859
}
```

---

### 5. Отримати відкриту сесію (при необхідності)
```
GET /v1/sessions/open/:playerId
```
- Якщо сесія є -> 200 OK з даними
- Якщо сесії немає -> 204 No Content

**Відповідь:**
```json
{
  "sessionId": "uuid",
  "startedAt": 1737080000000,
  "status": "open"
}
```

## Структура проекту

```
stamina-server
- main.ts               # точка входу
-- src
--- app.ts              # ініціалізація express
--- routes/             # файли з router'ами
--- controllers/        # обробники запитів
--- services/           # бізнес-логіка (sessions, players, stamina, db)
--- types.ts
--- utils.ts
- .env.example          # приклад конфігурації
```

## Властивості проекту
- Відновлення stamina по таймеру (ліниве обчислення при кожному запиті).
- Відлік відновлення стартує лише коли stamina зменшилася від максимуму.
- Заборона відкривати нову сесію, якщо вже є активна.
- Ідемпотентність для `sessions/end` (захист від повторних викликів).
- Просте збереження у `db.json`.

## Приклади запитів (cURL)
```bash
# Зареєструвати гравця
curl -sX POST http://localhost:3000/v1/players/register  \
  -H "content-type: application/json" \
  -d '{"name":"PLAYER_NAME"}' | jq

# Подивитись stamina
curl -s http://localhost:3000/v1/stamina/player/PLAYER_ID | jq

# Старт рівня
curl -sX POST http://localhost:3000/v1/sessions/start/PLAYER_ID | jq

# Завершення рівня з поразкою
curl -sX POST http://localhost:3000/v1/sessions/end/PLAYER_ID \
  -H "content-type: application/json" \
  -d '{"sessionId":"SESSION_ID","outcome":"lose","idempotencyKey":"generated-key"}' | jq
  
# Отримання відкритої сессії
curl -sX http://localhost:3000/v1/sessions/open/PLAYER_ID | jq
```

## Мінімізація трафіку та відновлення клієнта
Мінімум трафіку - клієнт відправляє тільки 2 події на гру: start і end сесії. Все інше (відновлення stamina, таймери) рахує і валідує сервер на запитах клієнта. Для надійності - використовується sessionId, idempotencyKey, локальне чергування подій на випадок офлайну і механізми TTL/реконсиляції на сервері.

**Додаткова мінімізація трафіку**: Заміна JSON протоколу коммунікації на бінарний (серіалізація/десеріалізація даних у узгодженному порядку). Розмір повідомлення у бінарному форматі може бути у **10х** разів меньшим.

### Сценарії: ###

***Нормальна гра***
```
Client -> POST /sessions/start {playerId}
Server: recalc -> ok, create sessionId -> returns {sessionId, staminaBefore, serverTime}

Client plays...

Client -> POST /sessions/end {playerId, sessionId, outcome=lose, idempotencyKey}
Server: if idempotency -> return cached; else applyLoss(), close session -> return {stamina, nextRefillAt, serverTime}
```

***Зник мережевий зв'язок під час end (retry)***
```
Client -> POST /session/end (network fails)
Client stores locally: pendingEnd = {sessionId, outcome, idempotencyKey}
On reconnect -> retry POST /session/end with same idempotencyKey
Server: проверяет idempotency -> выполняет/возвращает результат только один раз
```

***Множинні пристрої***
```
Server дозволяє не більше однієї open session. Якщо інший пристрій намагається start - 409 з info про існуючу сесію.
```

***Прихід дзвінка / вихід з гри (телефонна пауза)***
```
Варіант A: коротка пауза -> Client НЕ відправляє sessions/end автоматично; сесія залишається відкритою.
Варіант B: дзвінок -> Client автоматично відправляє exit (списується stamina).
```

## Алгоритм відновлення stamina (сервер) ##

На будь-який вхідний запит по гравцю (start, end, get stamina) - виконувати lazyRecalc:

1. Якщо stamina >= max тоді nextRefillAt = null.
2. Якщо stamina < max і nextRefillAt == null тоді встановити nextRefillAt = now + REFILL_INTERVAL_MS.
3. Якщо now >= nextRefillAt тоді elapsed = now - nextRefillAt; gained = 1 + floor(elapsed / REFILL_INTERVAL_MS); canGain = min(gained, max - stamina); stamina += canGain; 
- Якщо stamina < max тоді nextRefillAt = now + REFILL_INTERVAL_MS інакше nextRefillAt = null.

Цей алгоритм гарантує, що відлік стартує саме тоді, коли гравець втратив одиницю із максимальної (бо applyLoss, якщо wasMax - ставить nextRefillAt = now + REFILL_INTERVAL_MS).

