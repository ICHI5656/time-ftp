const ftpd = require('ftpd');
const path = require('path');

// テスト用FTPサーバー
const server = new ftpd.FtpServer('127.0.0.1', {
  getInitialCwd: function() {
    return path.join(__dirname, 'test-uploads');
  },
  getRoot: function() {
    return path.join(__dirname, 'test-uploads');  
  },
  pasvPortRangeStart: 1025,
  pasvPortRangeEnd: 1050,
  tlsOptions: null,
  allowUnauthorizedTls: true,
  useWriteFile: false,
  useReadFile: false,
  uploadMaxSlurpSize: 7000
});

server.on('error', function(error) {
  console.error('FTP Server error:', error);
});

server.on('client:connected', function(connection) {
  var username = null;
  console.log('Client connected from ' + connection.remoteAddress);

  connection.on('command:user', function(user, success, failure) {
    if (user) {
      username = user;
      success();
    } else {
      failure();
    }
  });

  connection.on('command:pass', function(pass, success, failure) {
    if (pass) {
      success(username);
    } else {
      failure();
    }
  });
});

server.listen(2121);
console.log('テスト用FTPサーバーが起動しました: ftp://localhost:2121');
console.log('ユーザー名: 任意');
console.log('パスワード: 任意');