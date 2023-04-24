const fs = require('fs');

//言語取得して適切なjsonファイルを読み取る
function language_check(req){
  let language = req.headers['accept-language'];
  let primaryLanguage = language.split(',')[0].split(';')[0];
  if (primaryLanguage === "ja-JP"){
    primaryLanguage = "ja"
  }
  let filePath = `./language/${primaryLanguage}.json`;

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

module.exports = { language_check };