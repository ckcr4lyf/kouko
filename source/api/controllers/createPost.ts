import { Request, Response } from 'express';

import Post from '../../db/post';

export default async (req: Request, res: Response) => {

    const body = req.body;

    if (!body.title || !body.content){
        return res.status(400).json({
            error: "Missing required fields."
        });
    }

    if (typeof body.title !== "string" || typeof body.content !== "string"){
        return res.status(400).json({
            error: "Invalid field types."
        });
    }

    const post = new Post({
        title: body.title,
        content: body.content
    });

    await post.save();

    return res.status(201).json(post);
}