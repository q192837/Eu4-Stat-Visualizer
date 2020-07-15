//a dialog box module from electron
const { dialog } = require("electron").remote;



// Also note that document does not exist in a normal node environment
// button click event
document.getElementById("mybutton").addEventListener("click", loadZip, false);
    

async function loadZip(){
    let options = {properties:['openFile']};
    
    dialog.showOpenDialog(null, options).then(async (filename) => {

        var selectedFile = filename.filePaths[0]
        
        console.time(selectedFile);

        var AdmZip = require('adm-zip');
        var zip = new AdmZip(selectedFile);
        zip.extractAllTo("./", true);
        
        var startDate = await readMeta("./meta");
        
        console.log(startDate);
        console.timeEnd(selectedFile);
  });
}

async function readMeta(file) {
    return new Promise(resolve => {
    const fs = require('fs');
    startDate = "";
    const stream = fs.createReadStream(file, {encoding: 'utf8'});
    stream.on('data', meta => {
        startDate = getStartDate(meta)
        stream.destroy();
        });
    stream.on('close', () => {
        resolve(startDate);
      });
    });
  }
function getStartDate(data) {
    return data.match(/date=(\d*.\d*.\d*)/)[1];
}
