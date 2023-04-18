const express = require('express');
const mysql = require('mysql');
const ejs = require('ejs');
const session = require('express-session');
const app = express();
const fs = require('fs');
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
const bcrypt = require('bcrypt');
const saltRounds = 10;

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

//言語取得して適切なjsonファイルを読み取る
function language_check(req){
  let language = req.headers['accept-language'];
  let primaryLanguage = language.split(',')[0].split(';')[0];
  if (primaryLanguage === "ja-JP"){
    primaryLanguage = "ja"
  }
  let filePath = `./language/${primaryLanguage}.json`;
  console.log(filePath);
  let jsondata;
  if (fs.existsSync(filePath)) {
    let data = fs.readFileSync(filePath);
    jsondata = JSON.parse(data);
  } else {
    let data = fs.readFileSync('./language/en.json');
    jsondata = JSON.parse(data);
  }
  return jsondata;
}

function account_str_check(input) {
  //8文字以上かつアルファベットと数字のみ
  //ユーザーネームもなるため一時的に無効化する
  // const alphanumericRegex = /^[a-zA-Z0-9]{8,}$/; 
  const alphanumericRegex = /^[a-zA-Z0-9]+$/
  return alphanumericRegex.test(input);
}



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
  let jsondata = language_check(req);
  res.render('index', { tasks: results, language: jsondata});
  console.log(`${new Date() - time}ms`);
	});

});

//古い順
app.get('/default', (req, res) => {
	let time = new Date();
		//ログインしていないときリダイレクトする
	if (!req.session.userId) {
		return res.redirect('/login');
	}
		//ログインしているアカウントのタスクを取得
		connection.query('SELECT * FROM tasks WHERE user_id = ?', [req.session.userId], (err, results) => {
		if (err) throw err;
		let jsondata = language_check(req);
		res.render('default', { tasks: results, language: jsondata});
		console.log(`${new Date() - time}ms`);
	});

});




//アカウント作成ページ
app.get('/signup', (req, res) => {
  let jsondata = language_check(req);
	res.render('signup', { errorMessage: null, language: jsondata});
});

//ログインページ表示
app.get('/login', (req, res) => {
  let jsondata = language_check(req);
	res.render('login', { errorMessage: null, language: jsondata});
});






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



// サーバー起動
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
