import dotenv from 'dotenv';

dotenv.config();

const rawAllowedOrigins = process.env.FRONTEND_URL ?? '';
const allowedOrigins = rawAllowedOrigins
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const config = {
  port: Number(process.env.PORT) || 5000,
  corsOrigins: allowedOrigins.length > 0 ? allowedOrigins : true
};
