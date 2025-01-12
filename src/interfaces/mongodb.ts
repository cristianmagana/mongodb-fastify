export interface MongoService {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
}
