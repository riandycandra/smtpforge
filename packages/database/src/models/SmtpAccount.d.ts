import { Model, Optional } from 'sequelize';
export interface SmtpAccountAttributes {
    id: string;
    name: string;
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password_encrypted: string;
    from_email: string;
    from_name: string | null;
    retry_attempts: number;
    rate_limit_per_hour: number | null;
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
}
export interface SmtpAccountCreationAttributes extends Optional<SmtpAccountAttributes, 'id' | 'secure' | 'retry_attempts' | 'is_active' | 'from_name' | 'rate_limit_per_hour'> {
}
export declare class SmtpAccount extends Model<SmtpAccountAttributes, SmtpAccountCreationAttributes> implements SmtpAccountAttributes {
    id: string;
    name: string;
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password_encrypted: string;
    from_email: string;
    from_name: string | null;
    retry_attempts: number;
    rate_limit_per_hour: number | null;
    is_active: boolean;
    readonly created_at: Date;
    readonly updated_at: Date;
}
