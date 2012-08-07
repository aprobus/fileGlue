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
      fileGlue.tear(testFilePath, {tearSize: 8}, this.callback);
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

      assert.equal(createdFiles.length, 10);
    },

    'File contents are correct': function () {
      var fileChunk = fs.readFileSync(path.join(testFilesDir, 'simple.txt.0000.chunk'), 'utf8');
      assert.equal(fileChunk, 'Hello, t');

      fileChunk = fs.readFileSync(path.join(testFilesDir, 'simple.txt.0001.chunk'), 'utf8');
      assert.equal(fileChunk, 'his is a');
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

      fileGlue.glue(fileChunks, outputPath, function (err) {
        if (err) {
          return self.callback(err);
        }

        fs.readFile(outputPath, 'utf8', self.callback);
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
