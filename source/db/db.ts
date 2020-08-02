import mongoose from 'mongoose';

const mongo_uri = process.env.MONGO_URI;

if (mongo_uri === undefined){
    throw "Please define the MONGO_URI in the .env file!";
}

mongoose.connect(mongo_uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

mongoose.connection.on('connected', () => {
    console.log(`Connected to MongoDB`);
})

mongoose.connection.on('error', () => {
    console.log(`Error connecting to MongoDB`);
});

export default mongoose;