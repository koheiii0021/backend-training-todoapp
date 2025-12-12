import express, { Request, Response } from "express";
import { pool } from "./db";
import { tasksRouter } from "./routes/tasks";
import { authRouter } from "./routes/auth";

export const app = express();

app.use(express.json());
app.use('/tasks', tasksRouter);
app.use('/tasks/:id', tasksRouter);
app.use('/auth', authRouter);

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: "ok" });
});


app.get('/db-health', async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT NOW() as now');

        const row = result.rows[0];

        res.json({
            status: "ok",
            now: row.now,
        });
    } catch (err){
        console.error("DB-error", err);
        res.status(500).json({ status: 'DB-error' });
    }
});