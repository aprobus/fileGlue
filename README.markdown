[![build status](https://secure.travis-ci.org/aprobus/fileGlue.png)](http://travis-ci.org/aprobus/fileGlue)
#fileGlue
FileGlue is a nodejs module for splitting files into smaller chunks, and then reconstructing them again. In the process,
there should be no changes to the contents of the file.

## Usage

````javascript
var fileGlue = require('fileGlue');

fileGlue.glue(filePaths, outputFilePath, function (err) {
  //Files have now been 'glued' together, and written to outputFilePath
});

var options = {
  tearSize: 8, //Number of bytes per output file
  readSize: 1024 //Number of bytes to read from disk at a time
};
fileGlue.tear(filePath, opts, function (err) {
  //Files have been torn apart, and written to the directory that the original file was in
});
````

## Download
````
npm install fileGlue
````
