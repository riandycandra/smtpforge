import { Sequelize } from 'sequelize';
import { logger } from '@mailer/shared';

export const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  logging: false,
  define: {
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

export async function connectDatabase(options: { sync?: boolean } = { sync: false }) {
  try {
    await sequelize.authenticate();
    if (options.sync) {
      await sequelize.sync({ alter: true });
    }
    logger.info('Database connection established successfully.');
  } catch (error: unknown) {
    const formattedError = error instanceof Error
      ? { message: error.message, name: error.name, stack: error.stack }
      : error;
    logger.error('Unable to connect to the database:', formattedError);
    process.exit(1);
  }
}
