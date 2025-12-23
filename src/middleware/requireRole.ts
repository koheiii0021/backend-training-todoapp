
import { Request, Response, NextFunction }  from "express";


//役職の権限の認証
export const requireRole = (role: "manager" | "staff") => {
    return (req: Request, res: Response, next: NextFunction ) => {
        if(!req.user){
            return res.status(401).json({ error: '認証されてません' })
        }

        if(req.user.role !== role){
            return res.status(403).json({ error: '権限がありません' });
        }

        return next();
    }
}
