var vows = require('vows');
var assert = require('assert');
var path = require('path');
var fileGlue = require('../lib/fileGlue');
var fs = require('fs');

var testFilesDir = path.join(__dirname, 'testFiles');
var testOutputDir = path.join(__dirname, 'testOutput');

vows.describe('File Glue').addBatch({
  'Tearing a file apart with tear size < read size': {
    topic: function () {
      testFilePath = path.join(testFilesDir, 'simple.txt');

      var options = {
        tearSize: 8,
        readSize: 16,
        outputDir: testOutputDir
      };

      fileGlue.tear(testFilePath, options, this.callback);
    },

    'no error': function (err) {
      assert.ok(!err, 'Error tearing a file apart');
    },

    '10 files created': function (err) {
      var files = fs.readdirSync(testOutputDir)

      assert.ok(files.length > 0, 'No files found when tearing a file');

      var createdFiles = files.filter(function (file) {
        return /simple\.txt\.000\d\.chunk/.test(file);
      });

      assert.equal(createdFiles.length, 10);
    },

    'File contents are correct': function () {
      var fileChunk = fs.readFileSync(path.join(testOutputDir, 'simple.txt.0000.chunk'), 'utf8');
      assert.equal(fileChunk, 'Hello, t');

      fileChunk = fs.readFileSync(path.join(testOutputDir, 'simple.txt.0001.chunk'), 'utf8');
      assert.equal(fileChunk, 'his is a');
    }
  },

  'Tearing a file apart with tear size > read size': {
    topic: function () {
      testFilePath = path.join(testFilesDir, 'tearTest.txt');

      var options = {
        tearSize: 16,
        readSize: 4,
        outputDir: testOutputDir
      };

      fileGlue.tear(testFilePath, options, this.callback);
    },

    'no error': function (err) {
      assert.ok(!err, 'Error tearing a file apart');
    },

    '12 files created': function () {
      var files = fs.readdirSync(testOutputDir);

      assert.ok(files.length > 0, 'No files found when tearing a file');

      var createdFiles = files.filter(function (file) {
        return /tearTest\.txt\.\d{4}\.chunk/.test(file);
      });

      assert.equal(createdFiles.length, 12);
    },

    'File contents are correct': function () {
      var fileChunk = fs.readFileSync(path.join(testOutputDir, 'tearTest.txt.0000.chunk'), 'utf8');
      assert.equal(fileChunk, 'This file is int');

      fileChunk = fs.readFileSync(path.join(testOutputDir, 'tearTest.txt.0001.chunk'), 'utf8');
      assert.equal(fileChunk, 'ended to be torn');
    }
  },

  'Gluing a file together': {
    topic: function () {
      var self = this;
      var fileChunks = [
        path.join(testFilesDir, 'randoChunk1.txt'),
        path.join(testFilesDir, 'randoChunk2.txt')
      ];

      var outputPath = path.join(testOutputDir, 'rando.txt');

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

      var createdFile = path.join(testOutputDir, 'rando.txt');
      fs.unlinkSync(createdFile);
    }
  },

  'Gluing a file together with event emitter': {
    topic: function () {
      var self = this;
      var fileChunks = [
        path.join(testFilesDir, 'randoChunk1.txt'),
        path.join(testFilesDir, 'randoChunk2.txt')
      ];

      var outputPath = path.join(testOutputDir, 'rando2.txt');
      var fileGluer = fileGlue.glue(fileChunks, outputPath);

      var events = [];

      fileGluer.on('progress', function (filePath) {
        events.push({type: 'progress', data: filePath});
      });

      fileGluer.on('error', function (err) {
        events.push({type: 'error', data: err});
        onComplete();
      });

      fileGluer.on('end', function () {
        events.push({type: 'end', data: null});
        onComplete();
      });

      function onComplete () {
        self.callback(null, events, fs.readFileSync(outputPath, 'utf8'));
      }
    },

    'No errors': function (events) {
      assert.ok(events);

      var errorEvents = events.filter(function (event) {
        return event.type === 'error';
      });

      assert.equal(errorEvents.length, 0);
    },

    'Two progress events': function (events) {
      assert.ok(events);

      var progressEvents = events.filter(function (event) {
        return event.type === 'progress';
      });

      assert.equal(progressEvents.length, 2);
      assert.ok(/randoChunk1\.txt/.test(progressEvents[0].data));
      assert.ok(/randoChunk2\.txt/.test(progressEvents[1].data));
    },

    'Emitted an end event': function (events) {
      assert.ok(events);

      var endEvents = events.filter(function (event) {
        return event.type === 'end';
      });

      assert.equal(endEvents.length, 1);
    },

    'contents are correct': function (err, events, data) {
      assert.ok(data);
      assert.equal(data, 'This isa test.');

      var createdFile = path.join(testOutputDir, 'rando2.txt');
      fs.unlinkSync(createdFile);
    }
  },

  'Gluing a file together with event emitter invalid files': {
    topic: function () {
      var self = this;
      var fileChunks = [
        path.join(testFilesDir, 'randoChunkasdfasdf.txt'),
        path.join(testFilesDir, 'randoChunkkjasdjk.txt')
      ];

      var outputPath = path.join(testOutputDir, 'rando3.txt');
      var fileGluer = fileGlue.glue(fileChunks, outputPath);

      var events = [];

      fileGluer.on('progress', function (filePath) {
        events.push({type: 'progress', data: filePath});
      });

      fileGluer.on('error', function (err) {
        events.push({type: 'error', data: err});
        onComplete();
      });

      fileGluer.on('end', function () {
        events.push({type: 'end', data: null});
        onComplete();
      });

      function onComplete () {
        self.callback(null, events);
      }
    },

    'Error emitted': function (events) {
      assert.ok(events);

      var errorEvents = events.filter(function (event) {
        return event.type === 'error';
      });

      assert.equal(errorEvents.length, 1);
    }
  },

  'Invalid args callback': {
    topic: function () {
      var self = this;
      var outputPath = path.join(testOutputDir, 'rando.txt');

      fileGlue.glue(null, outputPath, function (err) {
        return self.callback(null, err);
      });
    },

    'Invalid args error': function (err) {
      assert.ok(err);
    }
  },

  'Invalid args event emitter': {
    topic: function () {
      var self = this;

      var outputPath = path.join(testOutputDir, 'rando3.txt');
      var fileGluer = fileGlue.glue(null, outputPath);

      var events = [];

      fileGluer.on('progress', function (filePath) {
        events.push({type: 'progress', data: filePath});
      });

      fileGluer.on('error', function (err) {
        events.push({type: 'error', data: err});
        onComplete();
      });

      fileGluer.on('end', function () {
        events.push({type: 'end', data: null});
        onComplete();
      });

      function onComplete () {
        self.callback(null, events);
      }
    },

    'Error emitted': function (events) {
      assert.ok(events);

      var errorEvents = events.filter(function (event) {
        return event.type === 'error';
      });

      assert.equal(errorEvents.length, 1);
    }
  }
}).run();
