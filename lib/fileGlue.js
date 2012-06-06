var fs = require('fs');
var async = require('async');

function glue (filePaths, outputFilePath, callback) {
  fs.open(outputFilePath, 'w', onOpen);

  var outputFd;
  function onOpen(err, fd) {
    if (err) {
      return callback(err);
    }

    outputFd = fd;

    async.forEach(filePaths, readChunkAndWrite, onCompletion);
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
    fs.close(onClose);
    callback();

    function onClose (closeError) {
      callback(err || closeError);
    }
  }
}

function tear (filePath, tearSize, callback) {
  var bytesRead = tearSize;
  var fileBuffer = new Buffer(tearSize);
  var chunkCount = 0;
  var fileFd;
  fs.open(filePath, 'r', onOpen);

  function onOpen(err, fd) {
    if (err) {
      return callback(err);
    }

    fileFd = fd;

    async.until(testReadComplete, readNextChunk, onCompletion);
  }

  function testReadComplete() {
    return bytesRead < maxReadSize;
  }

  function readNextChunk(callback) {
    fs.read(fileFd, fileBuffer, 0, tearSize, null, onRead);

    function onRead(err, bytesRead, buffer) {

    }
  }

  function onCompletion () {
    callback();
  }
}
