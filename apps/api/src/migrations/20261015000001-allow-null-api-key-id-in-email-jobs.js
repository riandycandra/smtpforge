'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('email_jobs', 'api_key_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'api_keys',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('email_jobs', 'api_key_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'api_keys',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });
  },
};

