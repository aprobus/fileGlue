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
  var outputFd;
  fs.open(outputFilePath, 'w', onOpen);

  function onOpen(err, fd) {
    if (err) {
      return callback(err);
    }

    outputFd = fd;

    async.forEachSeries(filePaths, readChunkAndWrite, onCompletion);
  }

  function readChunkAndWrite(file, rwCallback) {
    fs.readFile(file, onReadFile);

    function onReadFile (err, data){
      if (err) {
        return rwCallback(err);
      }

      fs.write(outputFd, data, 0, data.length, null, rwCallback);
    }
  }

  function onCompletion(err) {
    fs.close(outputFd, onClose);

    function onClose (closeError) {
      callback(err || closeError);
    }
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
