var fs = require('fs');
var path = require('path');
var async = require('async');
var EventEmitter = require('events').EventEmitter;

function glue (filePaths, outputFilePath, callback) {
  var glueEmitter = null;

  if (!callback) {
    glueEmitter = new EventEmitter();
  }

  if (!(filePaths && outputFilePath)) {
    process.nextTick(function () {
      if (callback) {
        callback(new Error('Invalid args'));
      } else {
        glueEmitter.emit('error', new Error('Invalid args'));
      }
    });

    return glueEmitter; //Glue is null if callback exists
  }

  var readError = null;

  var outputStream = fs.createWriteStream(outputFilePath);
  outputStream.on('close', function () {
    if (callback) {
      callback(readError);
    } else if (readError) {
      glueEmitter.emit('error', readError);
    } else {
      glueEmitter.emit('end');
    }
  });

  outputStream.on('error', function (err) {
    if (callback) {
      callback(err);
    } else {
      glueEmitter.emit('error', err);
    }
  });

  async.forEachSeries(filePaths, writeFileToStream.bind(null, outputStream, glueEmitter), onCompletion);

  if (!callback) {
    return glueEmitter;
  }

  function onCompletion(err) {
    readError = err;
    outputStream.end();
  }
}

function writeFileToStream(outputStream, glueEmitter, filePath, rwCallback) {
  var readStream = readStream = fs.createReadStream(filePath);

  readStream.on('data', function (data) {
    outputStream.write(data);
  });

  readStream.on('end', function () {
    if (glueEmitter) {
      glueEmitter.emit('progress', filePath);
    }

    rwCallback();
  });

  readStream.on('error', function (err) {
    rwCallback(err);
  });
}

function tear (filePath, opts, callback) {
  if (typeof(opts) === 'function') {
    callback = opts;
    opts = null;
  }

  callback = callback || function (){};
  opts = opts || {};

  if (!filePath) {
    process.nextTick(function () {
      callback(new Error('Invalid args'));
    });
    return;
  }

  var tearSize = opts.tearSize || 64 * 1024;
  var readSize = opts.readSize || 64 * 1024;

  tearFile(filePath, path.dirname(filePath), path.basename(filePath), tearSize, readSize, callback);
}

function tearFile (readPath, outputDir, outputFilePrefix, tearSize, readSize, callback) {
  var readStream = fs.createReadStream(readPath, {bufferSize: readSize});
  var chunkIndex = 0;
  var currentWriteStream = getNextWriteStream();
  var currentWriteSize = 0;

  readStream.on('data', handleData);

  readStream.on('error', function (err) {
    currentWriteStream.end();
    callback(err);
  });

  readStream.on('end', function () {
    currentWriteStream.on('close', function () {
      callback();
    });
    currentWriteStream.end();
  });

  function handleData (data) {
    if (currentWriteSize + data.length < tearSize) {
      currentWriteStream.write(data);
      currentWriteSize += data.length;
    } else if (currentWriteSize + data.length === tearSize) {
      currentWriteStream.write(data);
      currentWriteStream.end();
      currentWriteStream = getNextWriteStream();
    } else {
      var amountToHandle = tearSize - currentWriteSize;
      var handledData = data.slice(0, amountToHandle);
      handleData(handledData);

      var unhandledData = data.slice(amountToHandle);
      handleData(unhandledData);
    }
  }

  function getNextWriteStream () {
    var chunkIndexString = chunkIndex.toString();
    currentWriteSize = 0;
    chunkIndex++;

    var chunkFilePath = path.join(outputDir, outputFilePrefix + '.0000'.substring(0, 5 - chunkIndexString.length) + chunkIndexString + '.chunk');
    var nextWriteStream = fs.createWriteStream(chunkFilePath);
    return nextWriteStream;
  }
}

module.exports.glue = glue;
module.exports.tear = tear;
