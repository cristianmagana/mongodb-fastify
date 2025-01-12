import {GetSecretValueCommand, SecretsManagerClient} from '@aws-sdk/client-secrets-manager';
import {SecretService} from '../interfaces/secrets';
import assert from 'assert';
import {MongoDatabaseCredentials} from '../types/mongodb';

export const getSecretService = (smClient: SecretsManagerClient): SecretService => {
    const getSecret = async (name: string): Promise<MongoDatabaseCredentials> => {
        const secret = await smClient.send(new GetSecretValueCommand({SecretId: name}));
        assert(secret.SecretString, `Secret ${name} not found`);
        const mongoDbCreds = JSON.parse(secret.SecretString) as MongoDatabaseCredentials;
        assert(mongoDbCreds.username, `MongoDB username not found in secret ${name}`);
        assert(mongoDbCreds.password, `MongoDB password not found in secret ${name}`);
        assert(mongoDbCreds.database, `MongoDB database not found in secret ${name}`);
        assert(mongoDbCreds.host, `MongoDB host not found in secret ${name}`);
        return mongoDbCreds;
    };
    return {getSecret};
};
