const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
    })
    .then(() => console.log('DB connection successfull'))
    .catch((err) => console.log('ERROR', err));

// const testTour = new Tour({
//     name: 'The Park Camper',
//     price: 997,
// });

// testTour
//     .save()
//     .then((doc) => {
//         console.log(doc);
//     })
//     .catch((err) => console.log('ERROR', err));

// // console.log(process.env);

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`App running on port ${port}`);
});

process.on('uncaughtException', (err) => {
    console.log('UNCAUGHT EXCEPTION... SHUTTING DOWN');
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});

process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION... SHUTTING DOWN');
    console.log(err);
    server.close(() => {
        process.exit(1);
    });
});
