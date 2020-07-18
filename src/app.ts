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
        const test = new Campaign();
        test.readMeta("./meta");
        test.readGamestate("./gamestate");
        console.log(test.gameData)
        console.timeEnd(selectedFile);
  });
}

class Campaign {
  name: string
  startDate: string;
  playerCountry: string
  gameData: Map<string, Map<string, string>>
  constructor(){
    this.gameData = new Map<string, Map<string, string>>();
    this.playerCountry = "TUR";
  }
  async readMeta(file: string) {
    return new Promise(resolve => {
    const fs = require('fs');
    const stream = fs.createReadStream(file, {encoding: 'utf8'});
    stream.on('data', (meta: any) => {
        this.startDate = this.getStartDate(meta)
        stream.destroy();
        });
    stream.on('close', () => {
        resolve();
      });
    });
  }
 getStartDate(data: string) {
    return data.match(/date=(\d*.\d*.\d*)/)[1];
}
  async readGamestate(file: string) {
    return new Promise(resolve => {
    const fs = require('fs');
    fs.readFile(file, 'utf8', (error: any, gamestate: string) => {
      let starti = gamestate.indexOf("countries")+"countries".length;
      starti = gamestate.indexOf("countries", starti+"countries".length);
      const tagStart = starti;
      //console.log(tagStart);
      let endi;
      Campaign.AllTags.forEach((name: string, tag: string) => {
        let prevStarti = starti;
        starti = gamestate.indexOf(this.getTagSearch(tag), starti)
        this.gameData.set(tag, new Map());
        if(starti === -1){
          starti = prevStarti;
          //console.log(`NO ${ tag }`)
          return;
        }
        //console.log(this.getTagSearch(tag));
        //console.log(starti);
        Campaign.DataPoints.forEach((dataPoint: string) => {
          starti = gamestate.indexOf(dataPoint+'=', starti)
          if (starti === -1){
            starti = prevStarti;
            return;
          }
          endi = gamestate.indexOf('\n', starti);
          const dataValue = gamestate.substring(starti+dataPoint.length+1, endi);
          this.gameData.get(tag).set(dataPoint, dataValue);
          })
        })
        });
        resolve();
    });
  }

  getTagSearch(tag: string){
    const searchString = tag === this.playerCountry ? 'human' : 'has_set_government_name';
    return `${ tag }={\n\t\t${ searchString }`;
  }


}