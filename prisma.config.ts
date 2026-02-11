import { defineConfig } from '@prisma/config';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url:
      process.env.DIRECT_URL ||
      process.env.DATABASE_URL ||
      'postgresql://postgres.waximdqzopehmgjcpudg:2wfUNZLpsP6sFTOC@aws-1-eu-west-1.pooler.supabase.com:5432/postgres',
  },
});
