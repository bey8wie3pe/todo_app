const express = require('express');
const router = express.Router();
const ejs = require('ejs');
const session = require('express-session');
const fs = require('fs');
const mysql = require('mysql');
const { language_check } = require('./language');

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



router.use(session({
  secret: "alkjfafklajfklajfkakdfdsjfiwfwkf09458370924789540389m4v82;irojgptwjgh89b0654h0t3h8gb34t6htbghu89th09tynm90rcevn",
  resave: false,
  saveUninitialized: true,
  //30日保存する
  cookie: { maxAge: 60 * 60 *  24 * 30* 1000} 
}));




//追加した順に表示
router.get('/', (req, res) => {
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
router.get('/default', (req, res) => {
	let time = new Date();
		//ログインしていないときリダイレクトする
	if (!req.session.userId) {
		return res.redirect('/login');
	}
		//ログインしているアカウントのタスクを取得
		connection.query('SELECT * FROM tasks WHERE user_id = ?', [req.session.userId], (err, results) => {
		if (err) throw err;
		let jsondata = language_check(req);
		res.render('index', { tasks: results, language: jsondata});
		console.log(`${new Date() - time}ms`);
	});

});

router.get("/priority", (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }
  connection.query("SELECT * FROM tasks WHERE user_id = ? ORDER BY priority DESC",[req.session.userId],(err, results) => {
      if (err) throw err;
      let jsondata = language_check(req);
      res.render("index", { tasks: results, language: jsondata });
    }
  );
});



//アカウント作成ページ
router.get('/signup', (req, res) => {
  let jsondata = language_check(req);
	res.render('signup', { errorMessage: null, language: jsondata});
});

//ログインページ表示
router.get('/login', (req, res) => {
  let jsondata = language_check(req);
	res.render('login', { errorMessage: null, language: jsondata});
});

//ログアウト
router.get('/logout', function (req, res) {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/');
  });
});



module.exports = router;