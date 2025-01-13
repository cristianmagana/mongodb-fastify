import {getInitializer} from './config/initializer';
import {collectionRoutes} from './routes/collection-routes';

export const app = async () => {
    const initializer = await getInitializer('mongodb-api');
    const {fastify, dbClient, log} = initializer;
    log.info('Server started...');

    fastify.register(
        async instance => {
            await collectionRoutes(instance, dbClient);
        },
        {prefix: '/api/collections'}
    );

    try {
        await fastify.listen({port: 3000});
    } catch (err) {
        fastify.log.error(err);
        throw new Error(`Error starting server: ${err}`);
    }
};
