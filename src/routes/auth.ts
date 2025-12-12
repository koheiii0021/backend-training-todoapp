import { pool } from "../db";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Router, Request, Response } from "express";
import { error } from "node:console";

export const authRouter = Router();



//sign up 
authRouter.post('/signup', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        
        
        if(!email || !password ) {
            return res.status(400).json({ error: 'email, passwordは必須です' });
        }

        if(typeof email !== "string" || typeof password !== "string") {
            return res.status(400).json({ error: '文字列で指定してください' });
        }

        if(password.length < 8){
            return res.status(400).json({ error: "パスワードは8文字以上で設定してください" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (email, password_hash)
            VALUES ($1, $2)
            RETURNING id, email, role, created_at`,
            [email, hashedPassword]
        );

        return res.status(201).json(result.rows[0]);
    } catch (err: any) {
        if(err?.code === "23505"){
            return res.status(409).json({ error: 'このメールアドレスは既に使われてます' });
        }
        
        console.error('/signup error', err);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});
