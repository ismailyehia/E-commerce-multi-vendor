const { PrismaClient } = require('@prisma/client');

// Prisma Client singleton to prevent too many connections
// during hot reloading in development
const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV === 'development') {
  global.prisma = prisma;
}

const connectDB = async () => {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log(`MySQL Connected via Prisma to: ${process.env.DATABASE_URL?.split('@')[1]}`);
  } catch (error) {
    console.error(`DATABASE_CONNECTION_ERROR_CRITICAL: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
};

module.exports = { connectDB, prisma };
