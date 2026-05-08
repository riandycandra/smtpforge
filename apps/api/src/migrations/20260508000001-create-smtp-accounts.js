'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('smtp_accounts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      host: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      port: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      secure: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      password_encrypted: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      from_email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      from_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      retry_attempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 3,
      },
      rate_limit_per_hour: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('smtp_accounts');
  }
};
