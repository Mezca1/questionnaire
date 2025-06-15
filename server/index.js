const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 数据库连接配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'tianshuchang03',
  database: 'questionnaire_db'
};

// JWT密钥
const JWT_SECRET = 'your-secret-key';

// 创建数据库连接池
const pool = mysql.createPool(dbConfig);

// 初始化数据库表
const initDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    
    // 删除旧表（注意顺序：先删除有外键约束的表）
    await connection.query('DROP TABLE IF EXISTS answers');
    await connection.query('DROP TABLE IF EXISTS options');
    await connection.query('DROP TABLE IF EXISTS questionnaire_submissions');
    await connection.query('DROP TABLE IF EXISTS questions');
    await connection.query('DROP TABLE IF EXISTS questionnaires');
    await connection.query('DROP TABLE IF EXISTS users');

    // 创建用户表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建问卷表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS questionnaires (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // 创建问题表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        questionnaire_id INT NOT NULL,
        question_text TEXT NOT NULL,
        question_type VARCHAR(50) DEFAULT 'text',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (questionnaire_id) REFERENCES questionnaires(id)
      )
    `);

    // 创建选项表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS options (
        id INT PRIMARY KEY AUTO_INCREMENT,
        question_id INT NOT NULL,
        option_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (question_id) REFERENCES questions(id)
      )
    `);

    // 创建问卷提交记录表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS questionnaire_submissions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        questionnaire_id INT NOT NULL,
        user_id INT NOT NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (questionnaire_id) REFERENCES questionnaires(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // 创建答案表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS answers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        questionnaire_id INT NOT NULL,
        question_id INT NOT NULL,
        user_id INT NOT NULL,
        answer_text TEXT NOT NULL,
        submission_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (questionnaire_id) REFERENCES questionnaires(id),
        FOREIGN KEY (question_id) REFERENCES questions(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (submission_id) REFERENCES questionnaire_submissions(id)
      )
    `);

    connection.release();
    console.log('数据库表初始化成功');
  } catch (error) {
    console.error('数据库表初始化失败:', error);
  }
};

// 初始化数据库
initDatabase();

// 测试数据库连接
pool.getConnection()
  .then(connection => {
    console.log('数据库连接成功');
    connection.release();
  })
  .catch(err => {
    console.error('数据库连接失败:', err);
  });

// 注册接口
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('注册请求:', { username });

    // 检查用户名是否已存在
    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建新用户
    const [result] = await pool.query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );

    // 生成JWT
    const token = jwt.sign(
      { id: result.insertId, username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: '注册成功',
      token,
      user: {
        id: result.insertId,
        username
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ message: '注册失败' });
  }
});

// 登录接口
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('登录请求:', { username });

    // 查找用户
    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const user = users[0];

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 生成JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '登录失败' });
  }
});

// 验证token中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: '未提供认证令牌' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: '无效的认证令牌' });
    }
    req.user = user;
    next();
  });
};

// 获取用户信息接口
app.get('/api/user', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({
      user: {
        id: users[0].id,
        username: users[0].username
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ message: '获取用户信息失败' });
  }
});

// 创建问卷接口
app.post('/api/questionnaires', authenticateToken, async (req, res) => {
  try {
    const { title, description, questions } = req.body;
    console.log('创建问卷请求:', { title, questionsCount: questions?.length, userId: req.user.id });

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: '无效的问卷数据' });
    }

    // 验证用户是否存在
    const [users] = await pool.query(
      'SELECT id FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: '用户不存在，请重新登录' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 创建问卷
      const [questionnaireResult] = await connection.query(
        'INSERT INTO questionnaires (user_id, title, description) VALUES (?, ?, ?)',
        [req.user.id, title, description]
      );

      const questionnaireId = questionnaireResult.insertId;

      // 创建问题
      for (const question of questions) {
        await connection.query(
          'INSERT INTO questions (questionnaire_id, question_text, question_type) VALUES (?, ?, ?)',
          [questionnaireId, question.text, 'text']
        );
      }

      await connection.commit();
      res.json({
        message: '问卷创建成功',
        questionnaireId
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('创建问卷错误:', error);
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      res.status(401).json({ message: '用户不存在，请重新登录' });
    } else {
      res.status(500).json({ message: '创建问卷失败' });
    }
  }
});

// 获取问卷列表接口
app.get('/api/questionnaires', authenticateToken, async (req, res) => {
  try {
    const [questionnaires] = await pool.query(
      'SELECT * FROM questionnaires WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json({ questionnaires });
  } catch (error) {
    console.error('获取问卷列表错误:', error);
    res.status(500).json({ message: '获取问卷列表失败' });
  }
});

// 获取问卷详情接口
app.get('/api/questionnaires/:id', async (req, res) => {
  try {
    const [questionnaires] = await pool.query(
      'SELECT * FROM questionnaires WHERE id = ?',
      [req.params.id]
    );

    if (questionnaires.length === 0) {
      return res.status(404).json({ message: '问卷不存在' });
    }

    const questionnaire = questionnaires[0];

    // 获取问题列表
    const [questions] = await pool.query(
      'SELECT * FROM questions WHERE questionnaire_id = ?',
      [questionnaire.id]
    );

    questionnaire.questions = questions;
    res.json({ questionnaire });
  } catch (error) {
    console.error('获取问卷详情错误:', error);
    res.status(500).json({ message: '获取问卷详情失败' });
  }
});

// 删除问卷接口
app.delete('/api/questionnaires/:id', authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM questionnaires WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '问卷不存在' });
    }

    res.json({ message: '问卷删除成功' });
  } catch (error) {
    console.error('删除问卷错误:', error);
    res.status(500).json({ message: '删除问卷失败' });
  }
});

// 获取问卷填写情况接口
app.get('/api/questionnaires/:id/answers', authenticateToken, async (req, res) => {
  try {
    const questionnaireId = parseInt(req.params.id);

    // 验证问卷是否存在且属于当前用户
    const [questionnaires] = await pool.query(
      'SELECT id FROM questionnaires WHERE id = ? AND user_id = ?',
      [questionnaireId, req.user.id]
    );

    if (questionnaires.length === 0) {
      return res.status(404).json({ message: '问卷不存在或无权访问' });
    }

    // 获取所有提交记录
    const [submissions] = await pool.query(
      `SELECT s.id as submission_id, s.submitted_at, u.username
       FROM questionnaire_submissions s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.questionnaire_id = ?
       ORDER BY s.submitted_at DESC`,
      [questionnaireId]
    );

    // 获取每个提交的答案
    const submissionsWithAnswers = await Promise.all(submissions.map(async (submission) => {
      const [answers] = await pool.query(
        `SELECT a.*, q.question_text
         FROM answers a
         JOIN questions q ON a.question_id = q.id
         WHERE a.submission_id = ?`,
        [submission.submission_id]
      );

      return {
        submissionId: submission.submission_id,
        username: submission.username || '匿名用户',
        submittedAt: submission.submitted_at,
        answers: answers.map(answer => ({
          questionId: answer.question_id,
          questionText: answer.question_text,
          answerText: answer.answer_text
        }))
      };
    }));

    res.json({
      answers: submissionsWithAnswers
    });
  } catch (error) {
    console.error('获取问卷填写情况错误:', error);
    res.status(500).json({ message: '获取问卷填写情况失败' });
  }
});

// 获取用户填写的问卷列表
app.get('/api/user/questionnaires', authenticateToken, async (req, res) => {
  try {
    const [questionnaires] = await pool.query(
      `SELECT DISTINCT q.*, u.username as creator_name, a.created_at as answered_at
       FROM questionnaires q
       JOIN answers a ON q.id = a.questionnaire_id
       JOIN users u ON q.user_id = u.id
       WHERE a.user_id = ?
       ORDER BY a.created_at DESC`,
      [req.user.id]
    );

    res.json({ questionnaires });
  } catch (error) {
    console.error('获取用户填写的问卷列表错误:', error);
    res.status(500).json({ message: '获取用户填写的问卷列表失败' });
  }
});

// 提交问卷答案
app.post('/api/questionnaires/:id/submit', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { answers } = req.body

    // 验证问卷是否存在
    const [questionnaires] = await pool.query(
      'SELECT id FROM questionnaires WHERE id = ?',
      [parseInt(id)]
    );

    if (questionnaires.length === 0) {
      return res.status(404).json({ message: '问卷不存在' });
    }

    // 验证答案数量是否匹配
    const [questions] = await pool.query(
      'SELECT id FROM questions WHERE questionnaire_id = ?',
      [parseInt(id)]
    );

    if (answers.length !== questions.length) {
      return res.status(400).json({ message: '答案数量不匹配' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 创建提交记录
      const [submissionResult] = await connection.query(
        'INSERT INTO questionnaire_submissions (questionnaire_id, user_id, submitted_at) VALUES (?, ?, ?)',
        [parseInt(id), req.user.id, new Date()]
      );

      const submissionId = submissionResult.insertId;

      // 插入答案
      for (const answer of answers) {
        await connection.query(
          'INSERT INTO answers (questionnaire_id, question_id, user_id, answer_text, submission_id) VALUES (?, ?, ?, ?, ?)',
          [parseInt(id), answer.questionId, req.user.id, answer.text, submissionId]
        );
      }

      await connection.commit();
      res.json({
        message: '答案提交成功',
        submissionId
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('提交问卷答案错误:', error);
    res.status(500).json({ message: '提交问卷答案失败' });
  }
});

// 获取问卷统计接口
app.get('/api/questionnaires/:id/stats', authenticateToken, async (req, res) => {
  try {
    const [questionnaire] = await pool.query(
      'SELECT * FROM questionnaires WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (questionnaire.length === 0) {
      return res.status(404).json({ message: '问卷不存在' });
    }

    const [questions] = await pool.query(
      'SELECT * FROM questions WHERE questionnaire_id = ?',
      [req.params.id]
    );

    const stats = [];
    for (const question of questions) {
      const [answers] = await pool.query(
        'SELECT * FROM answers WHERE question_id = ?',
        [question.id]
      );

      let questionStats = {
        questionId: question.id,
        questionText: question.question_text,
        type: question.question_type,
        totalAnswers: answers.length
      };

      if (question.question_type === 'choice') {
        const [options] = await pool.query(
          'SELECT * FROM options WHERE question_id = ?',
          [question.id]
        );

        questionStats.options = options.map(option => ({
          optionId: option.id,
          optionText: option.option_text,
          count: answers.filter(a => a.answer_text === option.option_text).length
        }));
      }

      stats.push(questionStats);
    }

    res.json({ stats });
  } catch (error) {
    console.error('获取问卷统计错误:', error);
    res.status(500).json({ message: '获取问卷统计失败' });
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
}); 