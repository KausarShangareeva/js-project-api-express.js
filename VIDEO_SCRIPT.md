# Video Script / Текст для видео (8-10 мин)

---

## РУССКАЯ ВЕРСИЯ

---

### 1. Введение (~30 сек)

Привет! Сегодня я покажу свой бэкенд-проект — Happy Thoughts API. Это REST API, написанный на Node.js с Express и MongoDB. Он позволяет пользователям создавать "мысли", лайкать их, а также регистрироваться и логиниться. Я покажу код, объясню каждую часть, и покажу как я задеплоила проект на Render и подключила к фронтенду.

---

### 2. Обзор package.json (~30 сек)

Начнём с package.json. Здесь перечислены все библиотеки, которые я использую:

- **express** — это фреймворк для создания сервера и обработки запросов
- **mongoose** — библиотека для работы с MongoDB (базой данных)
- **cors** — позволяет фронтенду обращаться к нашему API (без этого браузер заблокирует запросы)
- **bcrypt** — для шифрования паролей пользователей
- **dotenv** — для хранения секретных данных (например, ссылка на базу данных) в файле .env
- **nodemon** — автоматически перезапускает сервер при изменении кода (для разработки)
- **babel** — позволяет использовать современный JavaScript (import/export)

Скрипт `npm run dev` запускает сервер в режиме разработки с nodemon.

---

### 3. Импорты и настройка сервера (~40 сек)

```
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
```

В начале файла я импортирую все нужные библиотеки.

Потом:

```
dotenv.config();
```
Это загружает переменные из файла `.env` — там хранится ссылка на базу данных.

```
const app = express();
app.use(cors());
app.use(express.json());
```

- `express()` — создаёт наше приложение
- `cors()` — разрешает запросы с других доменов (например, с фронтенда)
- `express.json()` — говорит серверу понимать JSON в теле запросов

```
mongoose.connect(mongoURL);
```
Эта строка подключает нас к MongoDB базе данных.

---

### 4. Модели данных (~1 мин)

**Модель User (Пользователь):**

У каждого пользователя есть:
- `name` — имя (обязательное, минимум 2 символа)
- `email` — электронная почта (обязательное, уникальное, проверяется формат)
- `password` — пароль (обязательное, минимум 6 символов, хранится в зашифрованном виде)
- `accessToken` — токен для авторизации (генерируется автоматически)

**Модель Thought (Мысль):**

У каждой мысли есть:
- `message` — текст (от 5 до 140 символов)
- `hearts` — количество лайков (по умолчанию 0)
- `createdAt` — дата создания (автоматически)
- `user` — ссылка на пользователя, который создал мысль (это связь между коллекциями)

---

### 5. Middleware для авторизации (~40 сек)

```
const auth = async (req, res, next) => { ... }
```

Это "прослойка" (middleware), которая проверяет — авторизован ли пользователь.

Как она работает:
1. Берёт токен из заголовка запроса `Authorization`
2. Если токена нет — возвращает ошибку 401 "Not logged in"
3. Ищет пользователя с таким токеном в базе данных
4. Если не находит — возвращает ошибку 401 "Invalid token"
5. Если нашёл — сохраняет пользователя в `req.user` и пропускает дальше (вызывает `next()`)

Я использую этот middleware на роутах, где нужна авторизация — создание, редактирование, удаление мыслей.

---

### 6. Seed Database (~30 сек)

```
if (process.env.RESET_DB === "true") { ... }
```

Эта часть проверяет: если переменная `RESET_DB` равна `true`, то база данных очищается и заполняется 10 примерами мыслей. Это удобно для тестирования — всегда есть начальные данные.

---

### 7. Роуты (endpoints) (~2 мин)

**GET /** — корневой роут. Возвращает список всех доступных endpoint-ов. Это как документация API.

**POST /register** — регистрация нового пользователя:
- Принимает имя, email и пароль
- Проверяет, не занят ли email
- Шифрует пароль с помощью bcrypt (пароль никогда не хранится в открытом виде!)
- Сохраняет пользователя и возвращает данные + токен

**POST /login** — вход:
- Принимает email и пароль
- Ищет пользователя по email
- Сравнивает пароль с зашифрованным (bcrypt.compare)
- Если всё ок — возвращает данные + токен

**GET /thoughts** — получить все мысли:
- Сортирует от новых к старым (`sort createdAt: -1`)
- Ограничивает до 20 штук (`limit(20)`)
- Подтягивает имя автора (`populate("user", "name")`)

**GET /thoughts/:id** — получить одну мысль по её ID

**POST /thoughts** (auth) — создать новую мысль:
- Требует авторизацию (middleware `auth`)
- Берёт текст из body и ID пользователя из `req.user`

**PATCH /thoughts/:id** (auth) — обновить мысль:
- Требует авторизацию
- Проверяет, что ты автор этой мысли (нельзя редактировать чужие)

**DELETE /thoughts/:id** (auth) — удалить мысль:
- Требует авторизацию
- Проверяет, что ты автор

**POST /thoughts/:id/like** — лайкнуть мысль:
- Увеличивает `hearts` на 1 с помощью `$inc`
- Не требует авторизации — любой может лайкнуть

---

### 8. Запуск сервера (~15 сек)

```
const port = process.env.PORT || 3000;
app.listen(port, () => { ... });
```

Сервер запускается на порту из переменной окружения (Render сам задаёт PORT) или на порту 3000 при локальной разработке.

---

### 9. Деплой на Render (~1 мин)

Чтобы задеплоить проект:

1. Я загрузила код на GitHub
2. Зашла на сайт render.com и создала новый Web Service
3. Подключила свой GitHub репозиторий
4. В настройках указала:
   - **Root Directory**: `backend` (потому что мой server.js лежит в папке backend)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. В разделе Environment Variables добавила:
   - `MONGO_URL` — ссылку на MongoDB Atlas (облачную базу данных)
   - `RESET_DB` — `true` (чтобы заполнить базу начальными данными)
6. Нажала Deploy — и через пару минут API стал доступен по ссылке от Render

Теперь мой API работает онлайн и любой может к нему обращаться!

---

### 10. Подключение к фронтенду Happy Thoughts (~1 мин)

В моём фронтенд-проекте `js-project-happy-thoughts` я заменила URL API.

Раньше фронтенд обращался к стандартному API от Technigo. Теперь он обращается к моему API на Render.

Я просто заменила базовый URL в коде фронтенда, например:

```
const API_URL = "https://мой-проект.onrender.com";
```

И теперь:
- Когда пользователь открывает страницу — фронтенд делает GET запрос на `/thoughts` и показывает все мысли
- Когда нажимает кнопку сердечка — отправляет POST на `/thoughts/:id/like`
- Когда пишет новую мысль — отправляет POST на `/thoughts`

Фронтенд и бэкенд работают вместе, но хостятся отдельно — фронтенд на Netlify, бэкенд на Render.

---

### 11. Тестирование в Postman (~1 мин)

Postman — это инструмент для тестирования API без фронтенда.

Примеры:

1. **GET все мысли**: метод GET, URL: `https://мой-проект.onrender.com/thoughts` — получаем список мыслей

2. **Регистрация**: метод POST, URL: `/register`, в Body (raw JSON):
   ```json
   {
     "name": "Kausar",
     "email": "kausar@test.com",
     "password": "123456"
   }
   ```
   В ответе получаем accessToken — его нужно скопировать

3. **Создать мысль** (с авторизацией): метод POST, URL: `/thoughts`,
   - В Headers добавляем: `Authorization: <ваш_токен>`
   - В Body: `{ "message": "Hello from Postman!" }`

4. **Лайкнуть мысль**: метод POST, URL: `/thoughts/<id>/like`

В Postman удобно тестировать все endpoint-ы, особенно те, которые требуют авторизацию — на фронтенде это сложнее проверить.

---

### 12. MongoDB Compass и Atlas (~1 мин)

**MongoDB Atlas** — это облачная база данных. Я создала бесплатный кластер (cluster) на mongodb.com.

Из Atlas я получила строку подключения (connection string), которую использую как `MONGO_URL`. Она выглядит примерно так:
```
mongodb+srv://username:password@cluster.mongodb.net/happythoughts
```

**MongoDB Compass** — это настольное приложение для просмотра базы данных. Я вставляю ту же строку подключения и могу:
- Видеть все коллекции (users, thoughts)
- Просматривать документы — каждая мысль, каждый пользователь
- Видеть зашифрованные пароли (они выглядят как длинная строка)
- Видеть связи между мыслями и пользователями через поле `user` (ObjectId)
- Редактировать или удалять данные вручную (для отладки)

---

### 13. Заключение (~20 сек)

Итого — я создала полноценный REST API с:
- Полным CRUD (создание, чтение, обновление, удаление)
- Авторизацией пользователей (регистрация, логин, токены)
- Шифрованием паролей
- Связями между моделями
- Деплоем на Render
- Подключением к фронтенду

Спасибо за внимание!

---
---

## ENGLISH VERSION

---

### 1. Introduction (~30 sec)

Hi! Today I'll walk you through my backend project — Happy Thoughts API. It's a REST API built with Node.js, Express, and MongoDB. It allows users to create "thoughts", like them, and also register and log in. I'll go through the code, explain each part, and show how I deployed it to Render and connected it to my frontend.

---

### 2. Package.json overview (~30 sec)

Let's start with package.json. Here are all the libraries I'm using:

- **express** — a framework for creating a server and handling requests
- **mongoose** — a library for working with MongoDB (our database)
- **cors** — allows the frontend to make requests to our API (without it, the browser would block requests)
- **bcrypt** — for hashing user passwords
- **dotenv** — for storing secret data (like the database URL) in a .env file
- **nodemon** — automatically restarts the server when code changes (for development)
- **babel** — allows us to use modern JavaScript syntax (import/export)

The script `npm run dev` starts the server in development mode with nodemon.

---

### 3. Imports and server setup (~40 sec)

```
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
```

At the top of the file, I import all the libraries I need.

Then:

```
dotenv.config();
```
This loads variables from the `.env` file — that's where the database connection string is stored.

```
const app = express();
app.use(cors());
app.use(express.json());
```

- `express()` — creates our application
- `cors()` — allows requests from other domains (like from our frontend)
- `express.json()` — tells the server to understand JSON in request bodies

```
mongoose.connect(mongoURL);
```
This line connects us to the MongoDB database.

---

### 4. Data Models (~1 min)

**User Model:**

Each user has:
- `name` — required, at least 2 characters
- `email` — required, unique, validated with a regex pattern
- `password` — required, at least 6 characters, stored encrypted
- `accessToken` — generated automatically, used for authentication

**Thought Model:**

Each thought has:
- `message` — the text (5 to 140 characters)
- `hearts` — number of likes (default 0)
- `createdAt` — creation date (set automatically)
- `user` — a reference to the user who created it (this links the two collections)

---

### 5. Authentication Middleware (~40 sec)

```
const auth = async (req, res, next) => { ... }
```

This is a middleware — a function that runs before the route handler.

How it works:
1. It takes the token from the `Authorization` header
2. If there's no token — returns 401 error "Not logged in"
3. Looks for a user with that token in the database
4. If not found — returns 401 "Invalid token"
5. If found — saves the user to `req.user` and calls `next()` to continue

I use this middleware on routes that require authentication — creating, editing, and deleting thoughts.

---

### 6. Seed Database (~30 sec)

```
if (process.env.RESET_DB === "true") { ... }
```

This part checks: if the `RESET_DB` environment variable is `true`, it clears the database and fills it with 10 sample thoughts. This is useful for testing — you always have some initial data.

---

### 7. Routes (endpoints) (~2 min)

**GET /** — the root route. Returns a list of all available endpoints. It works like API documentation.

**POST /register** — register a new user:
- Accepts name, email, and password
- Checks if the email is already taken
- Hashes the password with bcrypt (passwords are never stored in plain text!)
- Saves the user and returns their data + token

**POST /login** — log in:
- Accepts email and password
- Finds the user by email
- Compares the password with the hashed one (bcrypt.compare)
- If everything matches — returns user data + token

**GET /thoughts** — get all thoughts:
- Sorted from newest to oldest (`sort createdAt: -1`)
- Limited to 20 (`limit(20)`)
- Includes the author's name (`populate("user", "name")`)

**GET /thoughts/:id** — get a single thought by its ID

**POST /thoughts** (auth) — create a new thought:
- Requires authentication (the `auth` middleware)
- Takes the message from the body and the user ID from `req.user`

**PATCH /thoughts/:id** (auth) — update a thought:
- Requires authentication
- Checks that you are the author (you can't edit others' thoughts)

**DELETE /thoughts/:id** (auth) — delete a thought:
- Requires authentication
- Checks that you are the author

**POST /thoughts/:id/like** — like a thought:
- Increases `hearts` by 1 using `$inc`
- No authentication required — anyone can like

---

### 8. Starting the server (~15 sec)

```
const port = process.env.PORT || 3000;
app.listen(port, () => { ... });
```

The server starts on the port from the environment variable (Render sets PORT automatically) or on port 3000 for local development.

---

### 9. Deploying to Render (~1 min)

To deploy the project:

1. I pushed the code to GitHub
2. Went to render.com and created a new Web Service
3. Connected my GitHub repository
4. In the settings I specified:
   - **Root Directory**: `backend` (because my server.js is inside the backend folder)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. In Environment Variables I added:
   - `MONGO_URL` — the connection string from MongoDB Atlas (cloud database)
   - `RESET_DB` — `true` (to seed the database with initial data)
6. Clicked Deploy — and in a couple of minutes the API was live with a Render URL

Now my API is online and anyone can access it!

---

### 10. Connecting to Happy Thoughts frontend (~1 min)

In my frontend project `js-project-happy-thoughts`, I replaced the API URL.

Before, the frontend was using the default Technigo API. Now it points to my own API on Render.

I simply changed the base URL in the frontend code, for example:

```
const API_URL = "https://my-project.onrender.com";
```

And now:
- When a user opens the page — the frontend makes a GET request to `/thoughts` and displays all thoughts
- When they click the heart button — it sends a POST to `/thoughts/:id/like`
- When they write a new thought — it sends a POST to `/thoughts`

The frontend and backend work together but are hosted separately — frontend on Netlify, backend on Render.

---

### 11. Testing with Postman (~1 min)

Postman is a tool for testing APIs without a frontend.

Examples:

1. **GET all thoughts**: method GET, URL: `https://my-project.onrender.com/thoughts` — we get a list of thoughts

2. **Register**: method POST, URL: `/register`, in Body (raw JSON):
   ```json
   {
     "name": "Kausar",
     "email": "kausar@test.com",
     "password": "123456"
   }
   ```
   In the response we get an accessToken — copy it

3. **Create a thought** (with auth): method POST, URL: `/thoughts`,
   - In Headers add: `Authorization: <your_token>`
   - In Body: `{ "message": "Hello from Postman!" }`

4. **Like a thought**: method POST, URL: `/thoughts/<id>/like`

Postman is great for testing all endpoints, especially the ones that require authentication — it's harder to test those from the frontend.

---

### 12. MongoDB Compass and Atlas (~1 min)

**MongoDB Atlas** — is a cloud database. I created a free cluster on mongodb.com.

From Atlas I got a connection string, which I use as `MONGO_URL`. It looks something like:
```
mongodb+srv://username:password@cluster.mongodb.net/happythoughts
```

**MongoDB Compass** — is a desktop app for viewing the database. I paste the same connection string and I can:
- See all collections (users, thoughts)
- Browse documents — each thought, each user
- See the encrypted passwords (they look like a long string)
- See the relationships between thoughts and users through the `user` field (ObjectId)
- Edit or delete data manually (for debugging)

---

### 13. Conclusion (~20 sec)

To sum up — I built a full REST API with:
- Full CRUD (Create, Read, Update, Delete)
- User authentication (register, login, tokens)
- Password hashing
- Model relationships
- Deployment on Render
- Connection to a frontend

Thanks for watching!
