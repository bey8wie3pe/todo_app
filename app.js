const express = require('express');
const mysql = require('mysql');
const ejs = require('ejs');
const session = require('express-session');
const app = express();
const fs = require('fs');
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

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

//ログインセッション
app.use(session({
  secret: "alkjfafklajfklajfkakdfdsjfiwfwkf09458370924789540389m4v82;irojgptwjgh89b0654h0t3h8gb34t6htbghu89th09tynm90rcevn",
  resave: false,
  saveUninitialized: true,
  //30日保存する
  cookie: { maxAge: 60 * 60 *  24 * 30* 1000} 
}));



//タスクページ
// app.get('/', (req, res) => {
// 	let time = new Date();
// 		//ログインしていないときリダイレクトする
// 	if (!req.session.userId) {
// 		return res.redirect('/login');
// 	}
// 		//ログインしているアカウントのタスクを取得
// 		connection.query('SELECT * FROM tasks WHERE user_id = ?', [req.session.userId], (err, results) => {
// 		if (err) throw err;
// 		let jsonData = language_check(req);
// 		res.render('index', { tasks: results, language: jsonData});
// 		console.log(`${new Date() - time}ms`);
// 	});

// });
//追加した順に表示
app.get('/', (req, res) => {
	let time = new Date();
	//ログインしていないときリダイレクトする
	if (!req.session.userId) {
		return res.redirect('/login');
	}
  //ログインしているアカウントのタスクを取得
  connection.query('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC', [req.session.userId], (err, results) => {
  if (err) throw err;
  let jsonData = language_check(req);
  res.render('index', { tasks: results, language: jsonData});
  console.log(`${new Date() - time}ms`);
	});

});




//アカウント作成ページ
app.get('/signup', (req, res) => {
	res.render('signup', { errorMessage: null});
});

//ログインページ表示
app.get('/login', (req, res) => {
	res.render('login', {errorMessage: null});
});

function language_check(req){
  //言語取得して適切なjsonファイルを読み取る
  let language = req.headers['accept-language'];
  let primaryLanguage = language.split(',')[0].split(';')[0];
  let filePath = `./language/${primaryLanguage}.json`;
  let jsonData;
  if (fs.existsSync(filePath)) {
    let data = fs.readFileSync(filePath);
    jsonData = JSON.parse(data);
  } else {
    let data = fs.readFileSync('./language/en.json');
    jsonData = JSON.parse(data);
  }
  return jsonData;
}




//タスク追加処理
app.post('/add', (req, res) => {
  const taskName = req.body.taskName;
	const userId = req.session.userId;
  if (!req.session.userId) {
    return res.redirect('/login');
  }
	connection.query('INSERT INTO tasks (task_name, user_id) VALUES (?, ?)', [taskName, userId], (err, results)=> {
    if (err) throw err;
    res.redirect('/');
  });
});

// タスク削除処理
app.post('/delete', (req, res) => {
  const taskId = req.body.taskId;
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
  const username = req.body.username;
  const password = req.body.password;

  connection.query('SELECT * FROM users WHERE user_name = ?', [username], (err, results) => {
    if (err) throw err;

    if (results.length > 0) {
      res.render('signup', { errorMessage: 'ユーザー名が既に使用されています' });
    } else {
      connection.query('INSERT INTO users (user_name, user_password) VALUES (?, ?)', [username, password], (err, results) => {
        if (err) throw err;
        res.redirect('/login');
      });
    }
  });
});

// ログイン処理
app.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  connection.query('SELECT * FROM users WHERE user_name = ? AND user_password = ?', [username, password], (err, results) => {
    if (results.length > 0) {
      req.session.userId = results[0].id;
      res.redirect('/');
    } else {
      res.render('login', { errorMessage: 'ユーザーネームかパスワードが違います' });
    }
  });
  });


// サーバー起動
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
