#fileGlue
FileGlue is a nodejs module for splitting files into smaller chunks, and then reconstructing them again. In the process,
there should be no changes to the contents of the file.

## Usage

### Gluing

With callback
````javascript
var fileGlue = require('fileGlue');

fileGlue.glue(filePaths, outputFilePath, function (err) {
  //Files have now been 'glued' together, and written to outputFilePath
});
````

OR

With event emitter
````javascript
var glueEmitter = fileGlue.glue(filePaths, outputFilePath);
glueEmitter.on('error', function (err) {
    //Handle error
});

glueEmitter.on('progress', function (filePath){
    //Emitted every time an input file was successfully written to the output file
});

glueEmitter.on('end', function (){
    //All files have been written to the output file
});
````

### Tearing

````javascript
var options = {
  tearSize: 2048, //Number of bytes per output file
  readSize: 1024 //Number of bytes to read from disk at a time
  outputDir: '/path/to/save/loc' //Directory to save file chunks to. default = directory of filePath
};
fileGlue.tear(filePath, opts, function (err) {
  //Files have been torn apart, and written to the directory that the original file was in
});
````

## Download
````
npm install fileGlue
````
