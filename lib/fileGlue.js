var fs = require('fs');
var async = require('async');

function glue (filePaths, outputFilePath, callback) {
  if (!(filePaths && outputFilePath)) {
    process.nextTick(function () {
      callback(new Error('Invalid args'));
    });
    return;
  }

  callback = callback || function (){};
  var readError = null;

  var outputStream = fs.createWriteStream(outputFilePath);
  outputStream.on('close', function () {
    callback(readError);
  });

  outputStream.on('error', function (err) {
    callback(err);
  });

  async.forEachSeries(filePaths, readChunkAndWrite, onCompletion);

  function readChunkAndWrite(filePath, rwCallback) {
    var readStream = fs.createReadStream(filePath);

    readStream.on('data', function (data) {
      outputStream.write(data);
    });

    readStream.on('end', function () {
      rwCallback();
    });

    readStream.on('error', function (err) {
      rwCallback(err);
    });
  }

  function onCompletion(err) {
    readError = err;
    outputStream.end();
  }
}

function tear (filePath, tearSize, callback) {
  callback = callback || function (){};

  if (!(filePath && tearSize && tearSize > 0)) {
    process.nextTick(function () {
      callback(new Error('Invalid args'));
    });
    return;
  }

  var fileFd;
  var seenError = null;
  fs.open(filePath, 'r', onOpen);

  function onOpen(err, fd) {
    if (err) {
      return callback(err);
    }

    fileFd = fd;

    tearFile(fd, filePath, tearSize, onTearFile);
  }

  function onTearFile (err) {
    seenError = err;
    fs.close(fileFd, onClose);
  }

  function onClose (err) {
    callback(seenError || err);
  }
}

function tearFile (readFileDesc, filePrefix, tearSize, callback) {
  var chunkCount = 0;
  var readBuffer = new Buffer(tearSize);
  var lastRead = tearSize;

  async.until(testReadComplete, readNextChunk, callback);

  function testReadComplete() {
    return lastRead < tearSize;
  }

  function readNextChunk(readCallback) {
    fs.read(readFileDesc, readBuffer, 0, tearSize, null, onRead);

    function onRead(err, bytesRead, buffer) {
      if (err) {
        return readCallback(err);
      }

      lastRead = bytesRead;

      var chunkCountString = chunkCount.toString();
      var chunkFileName = filePrefix + '.' + '0000'.substr(chunkCountString.length) + chunkCountString + '.chunk';
      chunkCount++;
      fs.writeFile(chunkFileName, buffer, readCallback);
    }
  }
}

module.exports.glue = glue;
module.exports.tear = tear;
