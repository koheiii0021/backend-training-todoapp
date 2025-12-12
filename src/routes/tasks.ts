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
        const { title, detail, due_date, status, priority} = req.body;

        if(Number.isNaN(id) || id <= 0){
            res.status(400).json({ error: 'IDは必須です' });
            return ;
        }

        //(2) 不明キー　を検知して400　
        const allowedKeys = ["title", "detail", "due_date", "status", "priority"];
        const bodyKeys = Object.keys(req.body);

        const unknownKeys = bodyKeys.filter((k) => !allowedKeys.includes(k));
        if(unknownKeys.length > 0) {
            return res.status(400).json({ error: `不明なキーがあります: ${unknownKeys.join(", ")}`});
        }

        //(3) 空更新(更新対象がないとき) 400 ←ここもわからなくなった
        if(bodyKeys.length === 0){
            return res.status(400).json({ error: '更新項目がありません' });
        }

        //(4) バリデーション

        const setClauses = [];
        const values = [];

        //title 
        if(title !== undefined){
            if(typeof title !== "string" || title.trim().length === 0){
                return res.status(400).json({ error: 'titleは必須です' });
            }
            values.push(title);
            setClauses.push(`title = $${values.length}`);
        }

        //detail  
        if(detail !== undefined){
            if(!(typeof detail === "string" || detail === null)){
               return res.status(400).json({ error: 'detailは'})
            }
            values.push(detail);
            setClauses.push(`detail = $${values.length}`);
        }

        //due_date 
        if(due_date !== undefined){
            if(due_date !== null && typeof due_date !== "string") {
                return res.status(400).json({ error: 'error' });
            }

            if(typeof due_date === "string"){
                const d = new Date(due_date);
                if(Number.isNaN(d.getTime())){
                    res.status(400).json({ error: 'due_dateが正しくありません' })
                    return ;
                }
            }
            values.push(due_date);
            setClauses.push(`due_date = $${values.length}`);
        }

        //status
        if(status !== undefined){
            const allowedStatus = ['new', 'in_progress', 'completed'];
            if(!allowedStatus.includes(status)){
                return res.status(400).json({ error: 'ステータスがただしくありません' })
            }
            values.push(status);
            setClauses.push(`status = $${values.length}`);
        }

        //priority
        if(priority !== undefined){
            if(!Number.isInteger(priority) || priority < 1 || priority > 3){
               return res.status(400).json({ error: 'priorityは1~3で設定してください' });
            }
            values.push(priority);
            setClauses.push(`priority = $${values.length}`);    
        }

        setClauses.push("updated_at = now()");
        values.push(id)

        //SQL 動的に組む
        const sql = `
        UPDATE tasks
        SET ${setClauses.join(", ")}
        WHERE id = $${values.length}
        RETURNING id, title, detail, due_date, status, priority, updated_at`;

        const result = await pool.query(sql, values);

        if(result.rows.length === 0){
            return res.status(404).json({ error: 'IDが存在しません' })
        }
        return res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('PATCH /:id error', err);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

//削除
tasksRouter.delete('/:id', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if(Number.isNaN(id) || id <= 0){
           return res.status(400).json({ error: 'IDは必須です' });
        }

        const result = await pool.query(
            'DELETE FROM tasks WHERE id = $1 RETURNING id, title, status, priority, due_date, updated_at',
            [id]
        )

        if(result.rows.length === 0){
            return res.status(404).json({ error: '対象がみつかりません' });
        }

        return res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('DELETE /:id error', err);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});