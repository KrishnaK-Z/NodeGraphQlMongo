import schema from '../schema';
import resolvers from '../resolvers';
import models from '../database/models';
import jwt from 'jsonwebtoken';
import DataLoader from 'dataloader';
import loaders from '../loaders';
import {
    ApolloServer,
    AuthenticationError
} from 'apollo-server-express';

const getMe = async req => {
    const token = req.headers['x-token'];

    if (token) {
        try {
            return await jwt.verify(token, process.env.SECRET);
        } catch (e) {
            throw new AuthenticationError(
                'Your session expired. Sign in again.',
            );
        }
    }
};

const server = new ApolloServer({
    introspection: true,
    typeDefs: schema,
    resolvers,
    formatError: error => {
        // remove the internal sequelize error message
        // leave only the important validation error
        const message = error.message
            .replace('SequelizeValidationError: ', '')
            .replace('Validation error: ', '');

        return {
            ...error,
            message,
        };
    },
    context: async({ req, connection }) => {
        if (connection) {
            return {
                models,
                loaders: {
                    user: new DataLoader(keys =>
                        loaders.user.batchUsers(keys, models),
                    ),
                },
            };
        }

        if (req) {
            const me = await getMe(req);

            return {
                models,
                me,
                secret: process.env.SECRET,
                loaders: {
                    user: new DataLoader(keys =>
                        loaders.user.batchUsers(keys, models),
                    ),
                },
            };
        }
    },
});

module.exports = server;