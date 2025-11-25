import { defineConfig } from '@prisma/config';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    // Use direct connection for migrations when available, otherwise fall back to pooled URL.
    url:
      process.env.DIRECT_URL ||
      process.env.DATABASE_URL ||
      'postgresql://postgres.waximdqzopehmgjcpudg:et5ljUWEs17uSwio@aws-1-eu-west-1.pooler.supabase.com:5432/postgres',
  },
});
