# Local MongoDB Setup (Docker)

Run MongoDB locally in Docker instead of relying on MongoDB Atlas.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

## 1. Start MongoDB

```bash
docker run -d \
  --name clearview-mongo \
  -p 27017:27017 \
  mongo:7
```

This starts a MongoDB 7 container with no authentication, exposed on `localhost:27017`.

> **With authentication (optional):**
>
> ```bash
> docker run -d \
>   --name clearview-mongo \
>   -p 27017:27017 \
>   -e MONGO_INITDB_ROOT_USERNAME=clearview \
>   -e MONGO_INITDB_ROOT_PASSWORD=clearview_dev_password \
>   mongo:7
> ```
>
> If using auth, your URI becomes:
> `mongodb://clearview:clearview_dev_password@localhost:27017/clearview_db?authSource=admin`

## 2. Configure the backend

Create or edit `clearview/backend/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/clearview_db
MONGODB_DB_NAME=clearview_db
GEMINI_API_KEY=<your-key-from-aistudio.google.com>
GEMINI_MODEL=gemini-2.5-flash
```

## 3. Configure the frontend

Create `clearview/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CLEARVIEW_USER_ID=<user-id-from-seed-output>
```

## 4. Seed the database

```bash
cd clearview/backend
source venv/bin/activate   # or however you activate your virtualenv
python seed_data.py
```

The script prints a `USER ID` — copy it into `NEXT_PUBLIC_CLEARVIEW_USER_ID` in the frontend `.env.local` above, then restart the Next.js dev server.

## 5. Verify connectivity

```bash
python diagnose_mongo.py
```

Should print `OK: MongoDB Atlas responded to ping.` (the message says "Atlas" but it works for any MongoDB instance).

## Common Docker commands

| Task | Command |
|------|---------|
| Check container status | `docker ps -a --filter name=clearview-mongo` |
| Stop MongoDB | `docker stop clearview-mongo` |
| Start MongoDB (after stop/reboot) | `docker start clearview-mongo` |
| View logs | `docker logs clearview-mongo` |
| Remove container + data | `docker rm -f clearview-mongo` |
| Connect via shell | `docker exec -it clearview-mongo mongosh` |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Address already in use` on port 27017 | Another process is using 27017. Stop it or map to a different port: `-p 27018:27017` and update the URI to `localhost:27018`. |
| `Connection refused` | Container isn't running — `docker start clearview-mongo`. |
| `Authentication failed` | URI credentials must match `MONGO_INITDB_*` env vars. Include `?authSource=admin` for the root user. |
| Docker Desktop not running | Open Docker Desktop and wait for it to be ready, then retry. |
