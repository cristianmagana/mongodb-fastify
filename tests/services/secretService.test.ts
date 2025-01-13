import {SecretsManagerClient} from '@aws-sdk/client-secrets-manager';
// import {mock} from 'jest-mock-extended';
import {getSecretService} from '../../src/services/secret';
import {MongoDatabaseCredentials} from '../../src/types/mongodb';

// const SMClient = mock<SecretsManagerClient>({
//     send: jest.fn().mockResolvedValue({SecretString: ''}),
// });

describe('SecretService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should throw an error if the secret is empty', async () => {
        const secretName = 'test-secret';
        const smReturnValue = {
            send: jest.fn().mockResolvedValue({SecretString: ''}),
        } as unknown as SecretsManagerClient;

        await expect(getSecretService(smReturnValue).getSecret(secretName)).rejects.toThrow('Secret test-secret not found');
    });
    it('should throw an error if username is missing', async () => {
        const secretName = 'test-secret';
        const smReturnValue = {
            send: jest.fn().mockResolvedValue({SecretString: '{"password":"test","database":"test","host":"test"}'}),
        } as unknown as SecretsManagerClient;

        await expect(getSecretService(smReturnValue).getSecret(secretName)).rejects.toThrow('MongoDB username not found in secret test-secret');
    });
    it('should throw an error if password is missing', async () => {
        const secret = 'test-secret';
        const smReturnValue = {
            send: jest.fn().mockResolvedValue({SecretString: '{"username":"test","database":"test","host":"test"}'}),
        } as unknown as SecretsManagerClient;

        await expect(getSecretService(smReturnValue).getSecret(secret)).rejects.toThrow('MongoDB password not found in secret test-secret');
    });
    it('should throw an error if database is missing', async () => {
        const secret = 'test-secret';
        const smReturnValue = {
            send: jest.fn().mockResolvedValue({SecretString: '{"username":"test","password":"test","host":"test"}'}),
        } as unknown as SecretsManagerClient;
        await expect(getSecretService(smReturnValue).getSecret(secret)).rejects.toThrow('MongoDB database not found in secret test-secret');
    });
    it('should throw an error if host is missing', async () => {
        const secret = 'test-secret';
        const smReturnValue = {
            send: jest.fn().mockResolvedValue({SecretString: '{"username":"test","password":"test","database":"test"}'}),
        } as unknown as SecretsManagerClient;

        await expect(getSecretService(smReturnValue).getSecret(secret)).rejects.toThrow('MongoDB host not found in secret test-secret');
    });
    it('should return the secret', async () => {
        const secret = 'test-secret';
        const smReturnValue = {
            send: jest.fn().mockResolvedValue({SecretString: '{"username":"test","password":"test","database":"test","host":"test"}'}),
        } as unknown as SecretsManagerClient;

        const mockSecret: MongoDatabaseCredentials = {
            username: 'test',
            password: 'test',
            database: 'test',
            host: 'test',
        };

        const result = await getSecretService(smReturnValue).getSecret(secret);
        expect(result).toEqual(mockSecret);
    });
});
