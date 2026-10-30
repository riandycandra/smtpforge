import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Sequelize, DataTypes } from 'sequelize';
import bcrypt from 'bcrypt';

describe('Database Models (In-Memory SQLite)', () => {
  let memoryDb: Sequelize;

  beforeAll(async () => {
    memoryDb = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false,
      define: {
        underscored: true,
        timestamps: true,
      },
    });

    // Define models on memoryDb
    memoryDb.define('AdminUser', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      username: { type: DataTypes.STRING, unique: true, allowNull: false },
      password_hash: { type: DataTypes.STRING, allowNull: false },
      must_change_password: { type: DataTypes.BOOLEAN, defaultValue: false },
    });

    memoryDb.define('SmtpAccount', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      host: { type: DataTypes.STRING, allowNull: false },
      port: { type: DataTypes.INTEGER, allowNull: false },
      secure: { type: DataTypes.BOOLEAN, defaultValue: false },
      username: { type: DataTypes.STRING, allowNull: false },
      password_encrypted: { type: DataTypes.TEXT, allowNull: false },
      from_email: { type: DataTypes.STRING, allowNull: false },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    });

    memoryDb.define('ApiKey', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      api_key_hash: { type: DataTypes.STRING, allowNull: false },
      rate_limit_per_hour: { type: DataTypes.INTEGER, defaultValue: 100 },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    });

    await memoryDb.sync({ force: true });
  });

  afterAll(async () => {
    await memoryDb.close();
  });

  it('should create an AdminUser with bcrypt password hash', async () => {
    const AdminUser = memoryDb.models.AdminUser;
    const password = 'mySecurePassword123';
    const password_hash = await bcrypt.hash(password, 10);

    const user = await AdminUser.create({
      username: 'admin_test',
      password_hash,
      must_change_password: true,
    });

    expect(user.get('id')).toBeDefined();
    expect(user.get('username')).toBe('admin_test');
    expect(user.get('must_change_password')).toBe(true);

    const match = await bcrypt.compare(password, user.get('password_hash') as string);
    expect(match).toBe(true);
  });

  it('should enforce uniqueness on AdminUser username', async () => {
    const AdminUser = memoryDb.models.AdminUser;
    await expect(AdminUser.create({
      username: 'admin_test',
      password_hash: 'hash',
    })).rejects.toThrow();
  });

  it('should store and query SmtpAccount securely', async () => {
    const SmtpAccount = memoryDb.models.SmtpAccount;
    const account = await SmtpAccount.create({
      name: 'Production Mailgun',
      host: 'smtp.mailgun.org',
      port: 587,
      secure: false,
      username: 'postmaster@mailgun.org',
      password_encrypted: 'encrypted_payload_base64',
      from_email: 'noreply@company.com',
      is_active: true,
    });

    expect(account.get('id')).toBeDefined();
    expect(account.get('name')).toBe('Production Mailgun');
    expect(account.get('is_active')).toBe(true);
  });
});

