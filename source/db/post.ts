import mongoose from './db';

const postSchema = new mongoose.Schema({
    title: String,
    content: String
});

interface post extends mongoose.Document {
    title: string,
    content: string
};

export default mongoose.model<post>('post', postSchema);