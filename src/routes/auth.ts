import { pool } from "../db";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Router, Request, Response } from "express";

const JWT_SECRET = process.env.JWT_SECRET;
if(!JWT_SECRET){
    throw new Error("JWT is not set");
}

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
        return res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

//login
authRouter.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if(!email || !password){
            return res.status(400).json({ error: 'email, password必須です' });
        }

        const result = await pool.query(
            'SELECT id, email, password_hash, role FROM users WHERE email = $1',
            [email]
        )

        if(result.rows.length === 0){
            return res.status(401).json({ error: 'ユーザーが登録されていません' });
        }

        const user = result.rows[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if(!isMatch){
            return res.status(401).json({ error: 'email, passwordが正しくありません' });
        }

        const payload = { userId: user.id, role: user.role };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
        
        res.status(200).json({ token });
    } catch (err) {
        console.error('POST /login error', err);
        return res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});