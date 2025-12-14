import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";


const JWT_SECRET = process.env.JWT_SECRET;
if(!JWT_SECRET){
    throw new Error("JWT_SECRET is not set");
}

type AuthPayload = JwtPayload & {
    userId: number;
    role: "manager" | "staff";
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction ) => {
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({ error: 'トークンがありません' });
    }

    const token = authHeader.split(" ")[1]

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;

        if(!decoded.userId || !decoded.role){
            return res.status(401).json({ error: '認証エラー' });
        }

        req.user = { userId: decoded.userId, role: decoded.role };
        return next();
    } catch (err) {
        return res.status(401).json({ error: '認証エラー' });
    }
};