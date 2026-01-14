import {getLogger} from '../utils/logger';
import {Initializer} from '../types/initializer';
import {MongoClient, ServerApiVersion} from 'mongodb';
import {getSecretService} from '../services/secret';
import {SecretsManagerClient} from '@aws-sdk/client-secrets-manager';
import {MONGO_SECRET_NAME} from './mongo';
import Fastify from 'fastify';

export const getInitializer = async (name: string): Promise<Initializer> => {
    const log = getLogger(name);
    log.info('Creating the Initializer object...');
    const fastify = Fastify({
        logger: true,
    });

    let dbClient: MongoClient;

    // Check for local MongoDB URI override
    const localMongoUri = process.env.MONGODB_URI;
    if (localMongoUri) {
        log.info('Using local MongoDB URI from MONGODB_URI environment variable');
        dbClient = new MongoClient(localMongoUri);
    } else {
        // Fall back to AWS Secrets Manager for cloud deployment
        log.info('Fetching MongoDB credentials from AWS Secrets Manager');
        const smClient = new SecretsManagerClient({});
        const mongoDBCreds = await getSecretService(smClient).getSecret(MONGO_SECRET_NAME);

        log.debug('MongoDB credentials:', JSON.stringify(mongoDBCreds, null, 2));

        const databaseUri = `mongodb+srv://${mongoDBCreds.username}:${mongoDBCreds.password}@${mongoDBCreds.host}`;

        dbClient = new MongoClient(databaseUri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
        });
    }

    return {dbClient, fastify, log};
};
