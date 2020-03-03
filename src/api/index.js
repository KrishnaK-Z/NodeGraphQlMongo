import 'dotenv/config';
import cors from 'cors';
import morgan from 'morgan';
import express from 'express';

const app = express();

app.use(cors());

app.use(morgan('dev'));

const server = require('./apolloServer');

server.applyMiddleware({ app, path: '/graphql' });

exports.app = app;
exports.server = server;