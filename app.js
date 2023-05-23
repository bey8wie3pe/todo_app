const express = require('express');
const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
const bcrypt = require('bcrypt');
const saltRounds = 10;
const fs = require('fs');
const { language_check } = require('./routes/language');
const https = require('https');

// HTTPSサーバーの設定
const options = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt')
};



const mysql = require('mysql');

//MySQL接続設定
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'shou0810',
  database: 'todo_app'
});

//DB接続
connection.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL');
});



const get = require("./routes/get");

app.use("/", get);
app.use("/default", get);
app.use("/signup", get);
app.use("/login", get);


function account_str_check(input) {
  //8文字以上かつアルファベットと数字のみ
  //ユーザーネームもなるため一時的に無効化する
  // const alphanumericRegex = /^[a-zA-Z0-9]{8,}$/; 
  const alphanumericRegex = /^[a-zA-Z0-9]+$/
  return alphanumericRegex.test(input);
}

//タスク追加処理
app.post('/add', (req, res) => {
  const taskName = req.body.taskName;
	const userId = req.session.userId;

  const priority = req.body['selected-value'];
  const deadline = req.body["deadline"];
  console.log(deadline);
  console.log(priority);
  if (!req.session.userId) {
    return res.redirect('/login');
  }
	connection.query('INSERT INTO tasks (task_name, user_id, priority, deadline) VALUES (?, ?, ?, ?)', [taskName, userId, priority, deadline], (err, results)=> {
    if (err) throw err;
    res.redirect('/');
  });
});

app.post('/default/add', (req, res) => {
  const taskName = req.body.taskName;
	const userId = req.session.userId;

  if (!req.session.userId) {
    return res.redirect('/login');
  }
	connection.query('INSERT INTO tasks (task_name, user_id) VALUES (?, ?)', [taskName, userId], (err, results)=> {
    if (err) throw err;
    res.redirect('/default');
  });
});

// タスク削除処理
app.post('/delete', (req, res) => {
  const taskId = req.body.taskId;
  console.log(taskId);
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  connection.query('DELETE FROM tasks WHERE id = ?', [taskId], (err, results) => {
    if (err) throw err;
    res.redirect('/');
  });
});

// アカウント作成処理
app.post('/signup', (req, res) => {
  const user_name = req.body.username;
  const password = req.body.password;
  //アルファベットと数字以外がある場合
  if (!account_str_check(user_name) || !account_str_check(password)){
    let jsondata = language_check(req);
    res.render('signup', { errorMessage: "使えるのはアルファベットと数字(いずれも半角)です", language: jsondata});
    return;
  }

  connection.query('SELECT * FROM users WHERE user_name = ?', [user_name], (err, results) => {
    if (err) throw err;

    if (results.length > 0) {
      let jsondata = language_check(req);
      res.render('signup', { errorMessage: 'ユーザー名が既に使用されています', language: jsondata});
      return;
    }

    bcrypt.hash(password, saltRounds, (err, hash) => {
      if (err) throw err;

      connection.query('INSERT INTO users (user_name, user_password) VALUES (?, ?)', [user_name, hash], (err, results) => {
        if (err) throw err;
        res.redirect('/login');
      });
    });
  });
});


// ログイン処理
app.post('/login', (req, res) => {
  const user_name = req.body.username;
  const password = req.body.password;
  connection.query('SELECT * FROM users WHERE user_name = ?', [user_name], (err, results) => {
    if (err) throw err;

    if (results.length > 0) {
      bcrypt.compare(password, results[0].user_password, (err, result) => {
        if (err) throw err;

        if (result === true) {
          req.session.userId = results[0].id;
          res.redirect('/');
        } else {
          let jsondata = language_check(req);
          res.render('login', { errorMessage: 'ユーザーネームかパスワードが違います', language: jsondata});
        }
      });
    } else {
      let jsondata = language_check(req);
      res.render('login', { errorMessage: 'ユーザーネームかパスワードが違います', language: jsondata});
    }
  });
});

//存在しないページの処理
app.use((req, res, next) => {
  res.status(404).redirect('/');
});



// openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 3650000

//HTTPSサーバーの作成
const server = https.createServer(options, app);

//HTTPSサーバーの起動
server.listen(3000, () => {
  console.log('HTTPS server started on port 3000');
});

// app.listen(3000, () => {
//   console.log("localhost:3000");
// })

