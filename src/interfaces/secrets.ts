import {MongoDatabaseCredentials} from '../types/mongodb';

export interface SecretService {
    getSecret: (name: string) => Promise<MongoDatabaseCredentials>;
}
