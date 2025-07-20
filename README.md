# BuzzVib

**BuzzVib** is a simple personal project that uses Node.js for backend and React for frontend.
It was built for learning, experimentation, and practicing full-stack development concepts, including queues and cloud integrations.

---

## 🚀 Features

- Backend API built with Express and TypeScript
- Frontend built with React and TypeScript
- Managing api requests from client using TanStack
- Cloudinary integration for image uploads
- Redis queue workers using BullMQ
- JWT-based authentication and refresh tokens
- Nodemailer email sending
- Example use of environment-based configuration

---

## 🗂️ Project Structure

```
.
├── api/          # Backend API code (Express + TypeScript)
├── client/       # Frontend app (Vite)
├── logs/         # Log files (ignored in Git)
├── package.json  # Root-level metadata and scripts
```

---

## ⚙️ Installing Dependencies

```bash
# Backend
cd api
npm i

# Frontend
cd ../client
npm i
```

---

## 💻 Running the App

```bash
# Start backend API
npm run api

# Start frontend
npm run client

# Start BullMQ workers
npm run workers
```

---

## 🌱 Environment Variables

This project uses environment variables to configure keys and secrets.  
Create a `.env.local` file in both `api/` and `client/` directories as needed.

### Example (`client/.env.local`)

```env
VITE_API_URL=http://localhost:3000
VITE_CLIENT_URL=http://localhost:5173
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### Example (`api/.env.local`)

```env
BULLMQ_PREFIX=buzzvib-dev
CLIENT_URL=http://localhost:5173
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
IPINFO_TOKEN=your-ipinfo-token
JWT_SECRET=your-jwt-secret
REFRESH_SECRET=your-refresh-token-secret
MODE=development
MONGODB_URI=your-mongodb-connection-uri
PORT=3000
REDIS_URL=your-redis-url
SMTP_USER=your-smtp-email
SMTP_PASS=your-smtp-app-password
SMTP_FROM=your-smtp-display-name
```

---

## 💬 Motivation

This project was created purely as a personal learning exercise to explore:

- Full-stack app structure (frontend + backend)
- Using TypeScript across both sides
- Background job processing with queues
- Working with external APIs and cloud services

---

## 🤝 Contributing

This is a personal/learning project, so contributions aren't expected, but feel free to fork or use it for inspiration!

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgements

- [Vite](https://vitejs.dev/)
- [React](https://react.dev/)
- [Express](https://expressjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [TanStack](https://tanstack.com/)
- [BullMQ](https://docs.bullmq.io/)
- [Cloudinary](https://cloudinary.com/)
- [Redis](https://redis.io/)
- [Nodemailer](https://nodemailer.com/)

---
