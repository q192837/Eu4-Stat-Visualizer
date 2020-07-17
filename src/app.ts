import { remote } from 'electron';
import { OpenDialogOptions } from 'electron';

// Also note that document does not exist in a normal node environment
// button click event
document.getElementById("mybutton").addEventListener("click", loadZip, false);

async function loadZip(){
    const options : OpenDialogOptions = "openFile" as OpenDialogOptions;

    remote.dialog.showOpenDialog(null, options).then(async (filename) => {

        const selectedFile = filename.filePaths[0];

        console.time(selectedFile);

        const AdmZip = require('adm-zip');
        const zip = new AdmZip(selectedFile);
        zip.extractAllTo("./", true);

        const startDate = await readMeta("./meta");

        console.log(startDate);
        console.timeEnd(selectedFile);
  });
}

async function readMeta(file: string) {
    return new Promise(resolve => {
    const fs = require('fs');
    let startDate = "";
    const stream = fs.createReadStream(file, {encoding: 'utf8'});
    stream.on('data', (meta: any) => {
        startDate = getStartDate(meta)
        stream.destroy();
        });
    stream.on('close', () => {
        resolve(startDate);
      });
    });
  }
function getStartDate(data: string) {
    return data.match(/date=(\d*.\d*.\d*)/)[1];
}

async function readGamestate(file: string) {
  return new Promise(resolve => {
  const fs = require('fs');
  let startDate = "";
  const stream = fs.createReadStream(file, {encoding: 'utf8'});
  stream.on('data', (meta: any) => {
      startDate = getStartDate(meta)
      stream.destroy();
      });
  stream.on('close', () => {
      resolve(startDate);
    });
  });
}

class Campaign {
  name: string
  startDate: string;
  playerCountry: string
  arr : { [key:string]:string; } = {"POL": "POLAND"};
}