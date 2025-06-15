-- 创建数据库
CREATE DATABASE IF NOT EXISTS questionnaire_db;
USE questionnaire_db;

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建问卷表
CREATE TABLE IF NOT EXISTS questionnaires (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 创建问题表
CREATE TABLE IF NOT EXISTS questions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  questionnaire_id INT NOT NULL,
  question_text TEXT NOT NULL,
  question_type ENUM('text', 'radio', 'checkbox', 'select') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (questionnaire_id) REFERENCES questionnaires(id)
);

-- 创建答案表
CREATE TABLE IF NOT EXISTS answers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  questionnaire_id INT NOT NULL,
  question_id INT NOT NULL,
  answer_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (questionnaire_id) REFERENCES questionnaires(id),
  FOREIGN KEY (question_id) REFERENCES questions(id)
); 