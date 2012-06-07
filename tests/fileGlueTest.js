var vows = require('vows');
var assert = require('assert');
var path = require('path');
var fileGlue = require('../lib/fileGlue');
var fs = require('fs');

var testFilesDir = path.join(__dirname, 'testFiles');

vows.describe('File Glue').addBatch({
  'Tearing a file apart': {
    topic: function () {
      testFilePath = path.join(testFilesDir, 'simple.txt');
      fileGlue.tearFile(testFilePath, 8, this.callback);
    },

    'no error': function (err) {
      assert.ok(!err, 'Error tearing a file apart');
    },

    '10 files created': function (err) {
      var files = fs.readdirSync(testFilesDir)

      assert.ok(files.length > 0, 'No files found when tearing a file');

      var createdFiles = files.filter(function (file) {
        return /simple\.txt\.000\d\.chunk/.test(file);
      });

      assert.equal(createdFiles.length, 10, 'Expected 10 file chunks');

      for (var i = 0; i < createdFiles.length; i++) {
        var chunkPath = path.join(testFilesDir, createdFiles[i]);
        fs.unlinkSync(chunkPath);
      }
    }
  },

  'Gluing a file together': {
    topic: function () {
      var self = this;
      var fileChunks = [
        path.join(testFilesDir, 'randoChunk1.txt'),
        path.join(testFilesDir, 'randoChunk2.txt')
      ];

      var outputPath = path.join(testFilesDir, 'rando.txt');

      fileGlue.glueFile(fileChunks, outputPath, function (err) {
        if (err) {
          return self.callback(err);
        }

        var createdFile = path.join(testFilesDir, 'rando.txt');
        fs.readFile(createdFile, 'utf8', self.callback);
      });
    },

    'No error': function (err, data) {
      assert.ok(!err);
    },

    'contents are correct': function (err, data) {
      assert.ok(data);
      assert.equal(data, 'This isa test.');

      var createdFile = path.join(testFilesDir, 'rando.txt');
      fs.unlinkSync(createdFile);
    }
  }
}).run();
