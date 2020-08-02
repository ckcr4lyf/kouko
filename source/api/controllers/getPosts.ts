import { Request, Response } from 'express';

import Post from '../../db/post';

export default async (req: Request, res: Response) => {

    const posts = await Post.find({});

    return res.status(200).json(posts);
}