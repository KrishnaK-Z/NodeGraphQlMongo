var couchbase = require('couchbase');

var cluster = new couchbase.Cluster('couchbase://localhost:8091', {
  username: 'Administrator',
  password: 'admin123',
});

var bucket = cluster.bucket('travel-sample', function(err) {
    if (err) {
        console.log('Bucket connection failed', err);
        return;
    }
    
    console.log('Connected to Couchbase!');
    });



// import http from 'http';
// import { connectDb } from './database/models';

// const {
//     app,
//     server
// } = require('./api');

// const httpServer = http.createServer(app);
// server.installSubscriptionHandlers(httpServer);

// const port = process.env.PORT || 8000;

// connectDb().then(async() => {

//     // reset database
//     // await Promise.all([
//     //     models.User.deleteMany({}),
//     //     models.Message.deleteMany({}),
//     // ]);

//     httpServer.listen({ port }, () => {
//         console.log(`Apollo Server on http://localhost:${port}/graphql`);
//     });
// });