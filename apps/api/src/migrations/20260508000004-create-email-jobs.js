'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('email_jobs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      job_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      api_key_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'api_keys',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      smtp_account_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'smtp_accounts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      to: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      cc: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      bcc: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      subject: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      html: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      attachments: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'queued',
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      smtp_response: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      retry_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      latency_ms: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: true,
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

    await queryInterface.addIndex('email_jobs', ['status'], {
      name: 'email_jobs_status_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('email_jobs');
  }
};
