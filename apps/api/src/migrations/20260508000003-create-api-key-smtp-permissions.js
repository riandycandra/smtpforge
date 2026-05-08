'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('api_key_smtp_permissions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      api_key_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'api_keys',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      smtp_account_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'smtp_accounts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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

    await queryInterface.addIndex('api_key_smtp_permissions', ['api_key_id', 'smtp_account_id'], {
      unique: true,
      name: 'api_key_smtp_permissions_unique_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('api_key_smtp_permissions');
  }
};
