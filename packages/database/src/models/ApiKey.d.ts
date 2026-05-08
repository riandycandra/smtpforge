import { Model, Optional } from 'sequelize';
export interface ApiKeyAttributes {
    id: string;
    name: string;
    api_key_hash: string;
    is_active: boolean;
    rate_limit_per_hour: number | null;
    created_at?: Date;
    updated_at?: Date;
}
export interface ApiKeyCreationAttributes extends Optional<ApiKeyAttributes, 'id' | 'is_active' | 'rate_limit_per_hour'> {
}
export declare class ApiKey extends Model<ApiKeyAttributes, ApiKeyCreationAttributes> implements ApiKeyAttributes {
    id: string;
    name: string;
    api_key_hash: string;
    is_active: boolean;
    rate_limit_per_hour: number | null;
    readonly created_at: Date;
    readonly updated_at: Date;
}
