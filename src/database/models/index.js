const mongoose = require('../database');

import User from './user';
import Message from './message';

const connectDb = async() => {
    if (process.env.DATABASE_URL) {

        if (!mongoose.connection.readyState) {
            await mongoose.connect(process.env.DATABASE_URL, {
                    useNewUrlParser: true,
                    useUnifiedTopology: true
                }).then(() => console.log('MongoDB connected'))
                .then(() => mongoose);

            // To prevent deprectation warnings (from MongoDB native driver)
            mongoose.set('useCreateIndex', true);
            mongoose.set('useFindAndModify', false);

            return mongoose;
        }
        return mongoose;
    }
};

// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on('connected', () => {
    console.log('Mongoose default connection open to');
});

// When connection throws an error
mongoose.connection.on('error', (error) => {
    console.log('Mongoose default connection error: ' + error);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', () => {
    console.log('Mongoose default connection disconnected');
});

// If the Node process ends, close the Mongoose connection 
process.on('SIGINT', function() {
    mongoose.connection.close(() => {
        console.log('Mongoose default connection disconnected through app termination');
        process.exit(0);
    });
});

const models = { User, Message };

export { connectDb };

export default models;