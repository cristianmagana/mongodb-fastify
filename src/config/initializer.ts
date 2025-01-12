import {getLogger} from '../utils/logger';
import {Initializer} from '../types/initializer';
import {MongoClient, ServerApiVersion} from 'mongodb';
import {getSecretService} from '../services/secret';
import {SecretsManagerClient} from '@aws-sdk/client-secrets-manager';
import {MONGO_SECRET_NAME} from './mongo';

export const getInitializer = async (name: string): Promise<Initializer> => {
    const log = getLogger(name);
    log.info('Creating the Initializer object...');

    const smClient = new SecretsManagerClient({});
    const mongoDBCreds = await getSecretService(smClient).getSecret(MONGO_SECRET_NAME);

    log.debug('MongoDB credentials:', JSON.stringify(mongoDBCreds, null, 2));

    const databaseUri = `mongodb+srv://${mongoDBCreds.username}:${mongoDBCreds.password}@${mongoDBCreds.host}`;

    const dbClient = new MongoClient(databaseUri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        },
    });

    return {dbClient, log};
};
