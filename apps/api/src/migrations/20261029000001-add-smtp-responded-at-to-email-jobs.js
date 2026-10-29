'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('email_jobs', 'smtp_responded_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('email_jobs', 'smtp_latency_ms', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('email_jobs', 'smtp_responded_at');
    await queryInterface.removeColumn('email_jobs', 'smtp_latency_ms');
  },
};

