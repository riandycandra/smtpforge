import { Model, Optional } from 'sequelize';
export interface ApiKeySmtpPermissionAttributes {
    id: string;
    api_key_id: string;
    smtp_account_id: string;
    created_at?: Date;
    updated_at?: Date;
}
export interface ApiKeySmtpPermissionCreationAttributes extends Optional<ApiKeySmtpPermissionAttributes, 'id'> {
}
export declare class ApiKeySmtpPermission extends Model<ApiKeySmtpPermissionAttributes, ApiKeySmtpPermissionCreationAttributes> implements ApiKeySmtpPermissionAttributes {
    id: string;
    api_key_id: string;
    smtp_account_id: string;
    readonly created_at: Date;
    readonly updated_at: Date;
}
