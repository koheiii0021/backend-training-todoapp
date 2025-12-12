import { error } from "node:console";
import { pool } from "../db";
import { Router, Request, Response } from "express";


export const tasksRouter = Router();

//作成
tasksRouter.post('/', async (req: Request, res: Response) => {
    try {
        const { title } = req.body;

        if(!title) {
            res.status(400).json({ error: 'titleは必須です' });
            return ;
        }

        const result = await pool.query(
            'INSERT INTO tasks (title) VALUES ($1) RETURNING id, title, status, priority, created_at',
            [title]
        )

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('POST /tasks error', err);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

//一覧
tasksRouter.get('/', async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            'SELECT id, title, status, priority, created_at, due_date FROM tasks ORDER BY created_at DESC'

        )

        res.status(200).json(result.rows);
    } catch (err) {
        console.error('GET /tasks error', err);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

//詳細
tasksRouter.get('/:id', async (req: Request, res: Response) => {
        try {
            const id = Number(req.params.id);

            if(Number.isNaN(id) || id <= 0){
                res.status(400).json({ error: 'idは必須です' });
                return ;
            }

            const result = await pool.query(
                'SELECT id, title, status, priority, created_at, due_date FROM tasks WHERE id = $1',
                [id]
            );

            if(result.rows.length === 0){
                return res.status(404).json({ error: "データがありません" });
            }

            res.status(200).json(result.rows[0])
        } catch (err) {
            console.error('GET /tasks/:id error', err);
            res.status(500).json({ error: 'サーバーエラーが発生しました' });
        }    
});

//更新

tasksRouter.patch('/:id', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const { status, priority} = req.body;

        if(Number.isNaN(id) || id <= 0){
            return res.status(400).json({ error: 'idは必須です' });
        }

        if(status === undefined && priority === undefined){
            res.status(400).json({ error : 'status または priority を指定してください' });
            return ;
        }

        const setClauses: string[] = [];
        const values: any = [];

        //status 任意
        if(status !== undefined){
            const allowed = ["new", "in_progress", "completed"];
            if(!allowed.includes(status)){
                return res.status(400).json({ error: "statusが不正です" });
            }

            values.push(status);
            setClauses.push(`status = $${values.length}`);
        }

        //priority　任意
        if(priority !== undefined){
            if(!Number.isInteger(priority) || priority < 1 || priority > 3){
                return res.status(400).json({ error: 'priorityは1~3で指定してください' });
            }
            values.push(priority);
            setClauses.push(`priority = $${values.length}`);
        }
        // update_atは必ず更新
        setClauses.push("updated_at = now()");

        // WHEREのidは最後
        values.push(id);

        const sql = `
        UPDATE tasks
        SET ${setClauses.join(", ")}
        WHERE id = $${values.length}
        RETURNING id, title, status, priority, updated_at, due_date
        `;

        const result = await pool.query(sql, values);

        if(result.rows.length === 0){
            return res.status(404).json({ error: "データがありません" });
        }
        return res.status(200).json(result.rows[0]);

    } catch (err) {
        console.error('PATCH /tasks/:id error', err);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});