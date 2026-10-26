'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('email_jobs', 'from_email', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('email_jobs', 'from_name', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('email_jobs', 'from_email');
    await queryInterface.removeColumn('email_jobs', 'from_name');
  },
};

