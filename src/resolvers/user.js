import jwt from 'jsonwebtoken';
import { combineResolvers } from 'graphql-resolvers';
import { AuthenticationError, UserInputError } from 'apollo-server';

import { isAdmin, isAuthenticated } from './authorization';

const createToken = async(user, secret, expiresIn) => {
    const { id, email, username, role } = user;
    return await jwt.sign({ id, email, username, role }, secret, {
        expiresIn,
    });
};

export default {
    Query: {
        users: async(parent, args, { models }) => {
            return await models.User.find();
        },
        user: async(parent, { id }, { models }) => {
            return await models.User.findById(id);
        },
        me: async(parent, args, { models, me }) => {
            if (!me) {
                return null;
            }

            return await models.User.findById(me.id);
        },
    },

    Mutation: {
        signUp: async(
            parent, { username, email, password }, { models, secret },
        ) => {
            const user = await models.User.create({
                username,
                email,
                password,
            });

            return { token: createToken(user, secret, '30m') };
        },

        signIn: async(
            parent, { login, password }, { models, secret },
        ) => {

            models.User.findUserByCredentials(login, password).then((user) => {
                user.createSession().then((refreshToken) => {
                    console.log("sss");
                    // Session created successfully - refreshToken returned.
                    // now we geneate an access auth token for the user

                    user.generateAccessAuthToken().then((accessToken) => {
                        // access auth token generated successfully, now we return an object containing the auth tokens
                        return { accessToken, refreshToken };
                    });

                }).then((authTokens) => {
                    // Now we construct and send the response to the user with their auth tokens in the header and the user object in the body
                    return { token: authTokens };
                }).catch(error => {

                })
            }).catch(error => {
                throw new UserInputError(
                    'No user found with this login credentials',
                );
            });
        },

        updateUser: combineResolvers(
            isAuthenticated,
            async(parent, { username }, { models, me }) => {
                return await models.User.findByIdAndUpdate(
                    me.id, { username }, { new: true },
                );
            },
        ),

        deleteUser: combineResolvers(
            isAdmin,
            async(parent, { id }, { models }) => {
                const user = await models.User.findById(id);

                if (user) {
                    await user.remove();
                    return true;
                } else {
                    return false;
                }
            },
        ),
    },

    User: {
        messages: async(user, args, { models }) => {
            return await models.Message.find({
                userId: user.id,
            });
        },
    },
};