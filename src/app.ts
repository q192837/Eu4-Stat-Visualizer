import { remote } from 'electron';
import { OpenDialogOptions } from 'electron';
import * as fs from "fs";
import { Stats } from 'fs';
import {v4 as uuid} from 'uuid';


// Also note that document does not exist in a normal node environment
// button click event
document.getElementById("mybutton").addEventListener("click", watchZip);

document.getElementById("saveButton").addEventListener("click", saveGameData);

document.getElementById("loadButton").addEventListener("click", loadGameData);

let autosaveLastModified : Date;

let autosavePath : string;


function watchZip(){
  const options : OpenDialogOptions = "openDirectory" as OpenDialogOptions;
  console.log(options);

  const filePaths = remote.dialog.showOpenDialogSync(null, options);
  const autosave = filePaths.find(name => name.includes("autosave") && name[0] !== 'o');
  fs.stat(autosave, (err: Error, stats: Stats) =>{
    autosaveLastModified = stats.mtime;
  });
  fs.watch(autosave, { encoding: 'buffer' }, watchFile);
  autosavePath = autosave;
}

function LoadZip(filename: string){
  const AdmZip = require('adm-zip');
  const zip = new AdmZip(filename.toString());
  const tempFolder: string = `./saves/temp/${ uuid() }`;
  zip.extractAllTo(tempFolder, true);
  test.processImport(tempFolder);
}

function watchFile(eventType: string, filename: string) {
  if (eventType) {
    console.log(eventType);
  }
  if (!filename) {
    return;
  }
  if (eventType === "change"){
    const stats = fs.statSync(autosavePath);
    if (stats.mtime.getTime() > autosaveLastModified.getTime()){
      autosaveLastModified = stats.mtime;
      LoadZip(autosavePath);
    }
  }
}

function saveGameData(){
  test.saveJson();
}

function loadGameData(){
  test.loadJson();
}

class Campaign {
  name: string
  startDate: string;
  playerCountry: string
  gameData: Map<string, Map<string, string[]>>
  saveCount: number;
  constructor(){
    this.gameData = new Map<string, Map<string, string[]>>();
    this.playerCountry = "TUR";
    this.saveCount = 0;
  }

  processImport(tempFolder: string){
    this.readMeta(`${ tempFolder }/meta`);
    this.readGamestate(`${ tempFolder }/gamestate`);
    this.cleanUpFiles(tempFolder);
    console.log(this.gameData.get("TUR"))
    if (++this.saveCount % 4 === 0){
      test.saveJson();
      console.log("SAVED");
      console.log(this.gameData);
    }
  }

  readMeta(file: string) {
      const meta = fs.readFileSync(file, 'utf8');
      this.setGameData("ALL", "date", this.getDate(meta));
  }

 getDate(data: string) {
    return data.match(/date=(\d*.\d*.\d*)/)[1];
}

  readGamestate(file: string) {
    const gamestate = fs.readFileSync(file, 'utf8');
    let starti = gamestate.indexOf("countries") + "countries".length;
    starti = gamestate.indexOf("countries", starti + "countries".length);
    const allCountriesStarti = starti;
    Campaign.AllTags.forEach((name: string, tag: string) => {
      const prevStarti = starti
      starti = gamestate.indexOf(this.getTagSearch(tag), starti)
      if(starti === -1) {
        starti = gamestate.indexOf(this.getTagSearch(tag), allCountriesStarti)
        if (starti === -1){
          starti = prevStarti
          return;
        }
      }
      const tagStarti = starti
      const tagEndi = gamestate.indexOf("mission_slot={", starti);
      const nation = gamestate.substring(tagStarti, tagEndi);
      Campaign.DataPoints.forEach((dataPoint: string) => {
        starti = nation.indexOf(dataPoint + '=', starti)
        if (starti === -1) {
          starti = 0;
          this.setGameData(tag, dataPoint, "NONE");
          return;
        }
        if(Campaign.additionalParseDataPoints.has(dataPoint)) {
          this.parseComplicatedDataPoint(tag, dataPoint, starti);
          return;
        }
        const endi = nation.indexOf('\n', starti);
        const dataValue = nation.substring(starti+dataPoint.length + 1, endi);
        this.setGameData(tag, dataPoint, dataValue);
      });
    });
  }

  getTagSearch(tag: string) {
    const searchString = tag === this.playerCountry ? 'human' : 'has_set_government_name';
    return `${ tag }={\n\t\t${ searchString }`;
  }

  setGameData(tag: string, dataPoint: string, dataValue: string) {
    if (!this.gameData.has(tag)) {
      this.gameData.set(tag, new Map());
    }
    if (this.gameData.get(tag).has(dataPoint)) {
      this.gameData.get(tag).get(dataPoint).push(dataValue)
    }
    else {
      this.gameData.get(tag).set(dataPoint, [dataValue]);
    }
  }

  parseComplicatedDataPoint(tag: string, dataPoint: string, starti: number) {
    return '';
  }

  saveJson(filename = `${ this.playerCountry }_${ this.gameData.get("ALL").get("date")[this.gameData.get("ALL").get("date").length - 1]}`){
    fs.writeFile(`./saves/${ filename }.json`, this.stringifyGameData(), {flag: "w"}, (err: Error) => {
      if(err) {
        return console.log(err);
      }
    });
  }

  stringifyGameData(){
    let saveData = "";
    let tagBegin = '{'
    this.gameData.forEach((data, tag) => {
      saveData += tagBegin + `"${ tag }": `
      tagBegin = "}, ";
      let dataPointBegin = "{"
      data.forEach((dataValues, dataPoint) => {
        saveData += dataPointBegin + `"${ dataPoint }": ["${ dataValues.join('", "') }"]`;
        dataPointBegin = ", ";
      })
    })
    return saveData + "}}";
  }

  async loadJson(filename="") {
    const gameDataObject = JSON.parse(fs.readFileSync("./saves/TUR_1496.1.1.json", 'utf8'));
    Object.keys(gameDataObject).forEach((tag: string) => {
      this.gameData.set(tag, new Map<string, string[]>());
      Object.keys(gameDataObject[tag]).forEach((dataPoint: string) => {
        this.gameData.get(tag).set(dataPoint, gameDataObject[tag][dataPoint])
      });
    });
    console.log(this.gameData);
  }

  cleanUpFiles(folder: string){
    fs.readdirSync(folder).forEach((file: string) => {
      fs.unlinkSync(`${folder}/${ file }`);
    });
    fs.rmdirSync(folder);
  }


  static DataPoints : string[] = ['human', 'history', 'national_focus', 'technology_cost', 'is_at_war', 'num_of_mercenaries', 'num_of_regulars', 'num_of_colonies', 'num_of_heathen_provs',
  'republican_tradition', 'root_out_corruption_sliderlegitimacy', 'absolutism', 'government_rank', 'religion', 'capital', 'trade_port', 'base_tax', 'raw_development', 'adm_tech',
  'dip_tech', 'mil_tech', 'current_power_projection', 'great_power_score', 'score', 'navy_strength', 'total_war_worth', 'num_of_rebel_controlled_provinces', 'num_of_rebel_armies',
  'num_owned_home_cores', 'non_overseas_developmen', 'num_of_controlled_cities', 'num_of_total_ports', 'num_of_cities', 'forts', 'num_of_allies', 'num_of_royal_marriages',
  'num_of_subjects', 'average_unrest', 'average_autonomy', 'prestige', 'stability', 'treasury', 'estimated_monthly_income', 'land_maintenance', 'naval_maintenance',
  'colonial_maintenance', 'missionary_maintenance', 'army_tradition', 'navy_tradition', 'lastmonthincome', 'lastmonthincometable', 'lastmonthexpense', 'lastmonthexpensetable', 'loan_size',
  'estimated_loan', 'religious_unity', 'meritocracy', 'corruption', 'mercantilism', 'splendor', 'active_idea_groups', 'army_professionalism', 'manpower', 'max_manpower', 'max_sailors', 'wants_to_be_great_power', 'needs_regiments',
  'needs_buildings', 'needs_ships']

  static additionalParseDataPoints : Set<string> = new Set(['history', 'lastmonthincometable', 'lastmonthexpensetable', 'active_idea_groups'])

  static test : Map<string, string> = new Map([["REB", "Rebels"]]);

  static AllTags : Map<string, string> = new Map([["REB", "Rebels"], ["PIR", "Pirates"], ["NAT", "Natives"], ["SWE", "Sweden"], ["DAN", "Denmark"], ["FIN", "Finland"], ["GOT", "Gotland"], ["NOR", "Norway"], ["SHL", "Holstein"], ["SCA", "Scandinavia"],
  ["EST", "Estonia"], ["LVA", "Livonia"], ["SMI", "Sami"], ["KRL", "Karelia"], ["ICE", "Iceland"], ["ACH", "PrincipalityOfAchaia"], ["ALB", "Albania"], ["ATH", "Athens"], ["BOS", "Bosnia"], ["BUL", "Bulgaria"],
  ["BYZ", "ByzantineEmpire"], ["CEP", "Corfu"], ["CRO", "Croatia"], ["CRT", "Crete"], ["CYP", "Cyprus"], ["EPI", "Epirus"], ["GRE", "Greece"], ["KNI", "Knights"], ["MOE", "Morea"], ["MOL", "Moldavia"],
  ["MON", "Montenegro"], ["NAX", "Naxos"], ["RAG", "Ragusa"], ["RMN", "Romania"], ["SER", "Serbia"], ["TRA", "Transylvania"], ["WAL", "Wallachia"], ["HUN", "Hungary"], ["SLO", "Slovakia"], ["TUR", "Ottomans"],
  ["CNN", "Connacht"], ["CRN", "Cornwall"], ["ENG", "England"], ["LEI", "Leinster"], ["IRE", "Ireland"], ["MNS", "IRE_Munster"], ["SCO", "Scotland"], ["TYR", "Tyrone"], ["WLS", "Wales"], ["NOL", "Northumberland"],
  ["GBR", "GreatBritain"], ["MTH", "Meath"], ["ULS", "Ulster"], ["DMS", "Desmond"], ["SLN", "Sligo"], ["KID", "Kildare"], ["HSC", "Highlands"], ["ORD", "Ormond"], ["TRY", "Tyrconnell"], ["FLY", "Faly"],
  ["MCM", "MacCarthy"], ["KOI", "Mann"], ["LOI", "TheIsles"], ["BRZ", "Brazil"], ["CAN", "Canada"], ["CHL", "Chile"], ["COL", "Colombia"], ["HAT", "Haiti"], ["LAP", "LaPlata"], ["LOU", "Louisiana"],
  ["MEX", "Mexico"], ["PEU", "Peru"], ["PRG", "Paraguay"], ["QUE", "Quebec"], ["CAM", "UPCA"], ["USA", "USA"], ["VNZ", "Venezuela"], ["AUS", "Australia"], ["CAL", "California"], ["TEX", "Texas"],
  ["DNZ", "Danzig"], ["KRA", "Krakow"], ["LIT", "Lithuania"], ["LIV", "LivonianOrder"], ["MAZ", "Mazovia"], ["POL", "Poland"], ["PRU", "Prussia"], ["KUR", "Kurland"], ["RIG", "Riga"], ["TEU", "Teutonicorder"],
  ["PLC", "TheCommonwealth"], ["VOL", "Volyn"], ["KIE", "Kiev"], ["CHR", "Chernigov"], ["OKA", "Oka"], ["ALE", "Alencon"], ["ALS", "Alsace"], ["AMG", "Armagnac"], ["AUV", "Auvergne"], ["AVI", "Avignon"],
  ["BOU", "Bourbonnais"], ["BRI", "Brittany"], ["BUR", "Burgundy"], ["CHP", "Champagne"], ["COR", "Corsica"], ["DAU", "Dauphine"], ["FOI", "Foix"], ["FRA", "France"], ["GUY", "Gascony"], ["NEV", "Nevers"],
  ["NRM", "Normandy"], ["ORL", "Orleans"], ["PIC", "Picardy"], ["PRO", "Provence"], ["SPI", "SardiniaPiedmont"], ["TOU", "Toulouse"], ["BER", "Berry"], ["AAC", "Aachen"], ["ANH", "Anhalt"], ["ANS", "Ansbach"],
  ["AUG", "Augsburg"], ["BAD", "Baden"], ["BAV", "Bavaria"], ["BOH", "Bohemia"], ["BRA", "Brandenburg"], ["BRE", "Bremen"], ["BRU", "Brunswick"], ["EFR", "EastFrisia"], ["FRN", "Frankfurt"], ["GER", "Germany"],
  ["HAB", "Austria"], ["HAM", "Hamburg"], ["HAN", "Hannover"], ["HES", "Hessen"], ["HLR", "HolyRomanEmpire"], ["KLE", "Kleves"], ["KOL", "Cologne"], ["LAU", "Lauenburg"], ["LOR", "Lorraine"], ["LUN", "Luneburg"],
  ["MAG", "Magdeburg"], ["MAI", "Mainz"], ["MEI", "Meissen"], ["MKL", "Mecklenburg"], ["MUN", "Munster"], ["MVA", "Moravia"], ["OLD", "Oldenburg"], ["PAL", "Palatinate"], ["POM", "Pommerania"], ["SAX", "Saxony"],
  ["SIL", "Silesia"], ["SLZ", "Salzburg"], ["STY", "Styria"], ["SWI", "Schweiz"], ["THU", "Thuringia"], ["TIR", "Tirol"], ["TRI", "Trier"], ["ULM", "Ulm"], ["WBG", "Wurzburg"], ["WES", "Westfalia"],
  ["WUR", "Wurttemberg"], ["NUM", "Nuremberg"], ["MEM", "Memmingen"], ["VER", "Verden"], ["NSA", "Nassau"], ["RVA", "Ravensburg"], ["DTT", "Dithmarschen"], ["ARA", "Aragon"], ["CAS", "Castille"], ["CAT", "Catalunya"],
  ["GRA", "Granada"], ["NAV", "Navarra"], ["POR", "Portugal"], ["SPA", "Spain"], ["GAL", "Galicia"], ["LON", "Leon"], ["ADU", "Andalusia"], ["VAL", "Valencia"], ["ASU", "Asturias"], ["MJO", "Majorca"],
  ["AQU", "Aquileia"], ["ETR", "Etruria"], ["FER", "Ferrara"], ["GEN", "Genoa"], ["ITA", "Italy"], ["MAN", "Mantua"], ["MLO", "Milan"], ["MOD", "Modena"], ["NAP", "Naples"], ["PAP", "Papal"],
  ["PAR", "Parma"], ["PIS", "Pisa"], ["SAR", "Sardinia"], ["SAV", "Savoy"], ["SIC", "Sicily"], ["SIE", "Siena"], ["TUS", "Tuscany"], ["URB", "Urbino"], ["VEN", "Venice"], ["MFA", "Montferrat"],
  ["LUC", "Lucca"], ["LAN", "Florence"], ["JAI", "Malta"], ["BRB", "Brabant"], ["FLA", "Flanders"], ["FRI", "Friesland"], ["GEL", "Gelre"], ["HAI", "Hainaut"], ["HOL", "Holland"], ["LIE", "Liege"],
  ["LUX", "Luxembourg"], ["NED", "Netherlands"], ["UTR", "Utrecht"], ["ARM", "Armenia"], ["AST", "Astrakhan"], ["CRI", "Crimea"], ["GEO", "Georgia"], ["KAZ", "Kazan"], ["MOS", "Muscowy"], ["NOV", "Novgorod"],
  ["PSK", "Pskov"], ["QAS", "QasimKhanate"], ["RUS", "Russia"], ["RYA", "Ryazan"], ["TVE", "Tver"], ["UKR", "Ukraine"], ["YAR", "Yaroslavl"], ["ZAZ", "Zaporozhie"], ["NOG", "Nogai"], ["SIB", "Sibir"],
  ["PLT", "Polotsk"], ["PRM", "Perm"], ["FEO", "Theodoro"], ["BSH", "Bashkiria"], ["BLO", "Beloozero"], ["RSO", "Rostov"], ["GOL", "GreatHorde"], ["GLH", "GoldenHorde"], ["ADE", "Aden"], ["ALH", "Haasa"],
  ["ANZ", "Anizah"], ["ARB", "Arabia"], ["ARD", "Ardalan"], ["BHT", "Bohtan"], ["DAW", "Dawasir"], ["ERE", "Eretna"], ["FAD", "Fadl"], ["GRM", "Germiyan"], ["HDR", "Hadramut"], ["HED", "Hedjaz"],
  ["LEB", "Lebanon"], ["MAK", "Makuria"], ["MDA", "Medina"], ["MFL", "Mikhlaf"], ["MHR", "Mahra"], ["NAJ", "Najd"], ["NJR", "Najran"], ["OMA", "Oman"], ["RAS", "Rassids"], ["SHM", "Shammar"],
  ["SHR", "Sharjah"], ["SRV", "Shirvanshah"], ["YAS", "Yas"], ["YEM", "Yemen"], ["HSN", "Ayyubids"], ["BTL", "Bitlis"], ["AKK", "AkKoyunlu"], ["AYD", "Aydin"], ["CND", "Candar"], ["DUL", "Dulkadir"],
  ["IRQ", "Iraq"], ["KAR", "Karaman"], ["SYR", "Syria"], ["TRE", "Trebizond"], ["SRU", "Saruhan"], ["MEN", "Mentese"], ["RAM", "Ramazan"], ["AVR", "Avars"], ["MLK", "Kashen"], ["SME", "Samtskhe"],
  ["ARL", "Ardabil"], ["MSY", "Mushashaiyyah"], ["RUM", "Rum"], ["ALG", "Algiers"], ["FEZ", "Fez"], ["MAM", "Burgi"], ["MOR", "Morocco"], ["TRP", "Tripoli"], ["TUN", "Tunisia"], ["EGY", "Egypt"],
  ["KBA", "Kabylia"], ["TFL", "Tafilalt"], ["SOS", "Sus"], ["TLC", "Tlemcen"], ["TGT", "Touggourt"], ["GHD", "Ghadames"], ["FZA", "Fezzan"], ["MZB", "Mzab"], ["SLE", "Sale"], ["TET", "Tetouan"],
  ["MRK", "Marrakesh"], ["KZH", "Kazakh"], ["KHI", "Khiva"], ["SHY", "Shaybanid"], ["KOK", "Kokkand"], ["BUK", "Bukhara"], ["AFG", "Afghanistan"], ["KHO", "Khorasan"], ["PER", "Persia"], ["QAR", "QaraKoyunlu"],
  ["TIM", "Timurid"], ["TRS", "Transoxiana"], ["KRY", "Gilan"], ["CIR", "Circassia"], ["GAZ", "Gazikumukh"], ["IME", "Imereti"], ["TAB", "Tabarestan"], ["ORM", "Ormuz"], ["LRI", "Luristan"], ["SIS", "Sistan"],
  ["BPI", "Biapas"], ["FRS", "Fars"], ["KRM", "Kerman"], ["YZD", "Yazd"], ["ISF", "Isfahan"], ["TBR", "Tabriz"], ["BSR", "Basra"], ["MGR", "Maregh"], ["QOM", "Qom"], ["AZT", "Aztec"],
  ["CHE", "Cherokee"], ["CHM", "Chimu"], ["CRE", "Creek"], ["HUR", "Huron"], ["INC", "Inca"], ["IRO", "Iroquois"], ["MAY", "Maya"], ["SHA", "Shawnee"], ["ZAP", "Zapotec"], ["ASH", "Ashanti"],
  ["BEN", "Benin"], ["ETH", "Ethiopia"], ["KON", "Kongo"], ["MAL", "Mali"], ["NUB", "Funj"], ["SON", "Songhai"], ["ZAN", "Swahili"], ["ZIM", "Mutapa"], ["ADA", "Adal"], ["HAU", "Hausa"],
  ["KBO", "KanemBornu"], ["LOA", "Loango"], ["OYO", "Oyo"], ["SOF", "Sofala"], ["SOK", "Sokoto"], ["JOL", "Jolof"], ["SFA", "SofalaSwa"], ["MBA", "Mombasa"], ["MLI", "Malindi"], ["AJU", "Ajuuraan"],
  ["MDI", "Mogadishu"], ["ENA", "Eneara"], ["AFA", "Afar"], ["ALO", "Alodia"], ["DAR", "Darfur"], ["GLE", "Geledi"], ["HAR", "Harar"], ["HOB", "Hobyo"], ["KAF", "Kaffa"], ["MED", "Medri Bahri"],
  ["MJE", "Majeerteen"], ["MRE", "Marehan"], ["PTE", "Pate"], ["WAR", "Warsangali"], ["BTI", "Semien"], ["BEJ", "Beja"], ["JIM", "Jima"], ["WLY", "Welayta"], ["DAM", "Damot"], ["HDY", "Hadiya"],
  ["SOA", "Shewa"], ["JJI", "Janjero"], ["ABB", "Dongola"], ["TYO", "Tyo"], ["SYO", "Soyo"], ["KSJ", "Kasanje"], ["LUB", "Luba"], ["LND", "Lunda"], ["CKW", "Chokwe"], ["KIK", "Kikondja"],
  ["KZB", "Kazembe"], ["YAK", "Yaka"], ["KLD", "Kalundwe"], ["KUB", "Kuba"], ["RWA", "Rwanda"], ["BUU", "Burundi"], ["BUG", "Buganda"], ["NKO", "Nkore"], ["KRW", "Karagwe"], ["BNY", "Bunyoro"],
  ["BSG", "Basoga"], ["UBH", "Buha"], ["MRA", "Maravi"], ["LDU", "Lundu"], ["TBK", "Tumbuka"], ["MKU", "Makua"], ["RZW", "Butua"], ["MIR", "Merina"], ["SKA", "Sakalava"], ["BTS", "Betsimisaraka"],
  ["MFY", "Mahafaly"], ["ANT", "Antemoro"], ["ANN", "Annam"], ["ARK", "Arakan"], ["ATJ", "Atjeh"], ["AYU", "Ayutthaya"], ["BLI", "Bali"], ["BAN", "Banten"], ["BEI", "Brunei"], ["CHA", "Champa"],
  ["CHG", "ChagataiKhanate"], ["CHK", "Champassak"], ["DAI", "DaiViet"], ["JAP", "Japan"], ["AMA", "Amago"], ["ASA", "Asakura"], ["CSK", "Chosokabe"], ["DTE", "Date"], ["HJO", "Hojo"], ["HSK", "Hosokawa"],
  ["HTK", "Hatakeyama"], ["IKE", "Ikeda"], ["IMG", "Imagawa"], ["MAE", "Maeda"], ["MRI", "Mori"], ["ODA", "Oda"], ["OTM", "Otomo"], ["OUC", "Ouchi"], ["SBA", "Shiba"], ["SMZ", "Shimazu"],
  ["TKD", "Takeda"], ["TKG", "Tokugawa"], ["UES", "Uesugi"], ["YMN", "Yamana"], ["RFR", "Nanbu"], ["ASK", "Ashikaga"], ["KTB", "Kitabatake"], ["ANU", "Ainu"], ["AKM", "Akamatsu"], ["AKT", "Ando"],
  ["CBA", "Chiba"], ["ISK", "Isshiki"], ["ITO", "Ito"], ["KKC", "Kikuchi"], ["KNO", "Kono"], ["OGS", "Ogasawara"], ["SHN", "Shoni"], ["STK", "Satake"], ["TKI", "Toki"], ["UTN", "Utsunomiya"],
  ["TTI", "Tsutsui"], ["KHA", "MongolKhanate"], ["KHM", "Khmer"], ["KOR", "Korea"], ["LNA", "LanNa"], ["LUA", "LuangPrabang"], ["LXA", "LanXang"], ["MAJ", "Majapahit"], ["MCH", "Manchu"], ["MKS", "Makassar"],
  ["MLC", "Malacca"], ["MNG", "Ming"], ["MTR", "Mataram"], ["OIR", "OiratHorde"], ["PAT", "Pattani"], ["PEG", "Pegu"], ["QNG", "Qing"], ["RYU", "Ryukyu"], ["SST", "Shan"], ["SUK", "Sukhothai"],
  ["SUL", "Sulu"], ["TAU", "Taungu"], ["TIB", "Tibet"], ["TOK", "Tonkin"], ["VIE", "Vientiane"], ["CZH", "Zhou"], ["CSH", "Shun"], ["CXI", "Xi"], ["YUA", "GreatYuan"], ["ILK", "Ilkhanate"],
  ["KLM", "Kalmyk"], ["MGE", "MongolEmpire"], ["MYR", "Yeren"], ["MHX", "Haixi"], ["MJZ", "Jianzhou"], ["KRC", "Khorchin"], ["KLK", "Khalkha"], ["HMI", "Karadel"], ["ZUN", "Zunghar"], ["KAS", "Yarkand"],
  ["CHH", "Chahar"], ["KSD", "Khoshuud"], ["SYG", "Sarigyogir"], ["UTS", "Utsang"], ["KAM", "Mdokhams"], ["GUG", "Guge"], ["PHA", "Phagmodrupa"], ["CDL", "Dali"], ["CYI", "Yi"], ["CMI", "Miao"],
  ["MIN", "Min"], ["YUE", "Yue"], ["SHU", "Shu"], ["NNG", "Ning"], ["CHC", "Chu"], ["TNG", "Tang"], ["WUU", "Wu"], ["QIC", "Qi"], ["YAN", "Yan"], ["JIN", "Jin"],
  ["LNG", "Liang"], ["QIN", "Qin"], ["HUA", "Huai"], ["CGS", "Changsheng"], ["BAL", "Baluchistan"], ["BNG", "Bengal"], ["BIJ", "Bijapur"], ["BAH", "Bahmanis"], ["DLH", "Delhi"], ["GOC", "Golconda"],
  ["DEC", "Deccan"], ["MAR", "Marathas"], ["MUG", "Mughal"], ["MYS", "Mysore"], ["VIJ", "Vijaynagara"], ["AHM", "Ahmadnagar"], ["ASS", "Assam"], ["GUJ", "Gujarat"], ["JNP", "Jaunpur"], ["MAD", "Madurai"],
  ["MLW", "Malwa"], ["MAW", "Marwar"], ["MER", "Mewar"], ["MUL", "Multan"], ["NAG", "Nagpur"], ["NPL", "Nepal"], ["ORI", "Orissa"], ["PUN", "Punjab"], ["SND", "Sind"], ["BRR", "Berar"],
  ["JAN", "Jangladesh"], ["KRK", "Carnatic"], ["GDW", "Gondwana"], ["GRJ", "Garjat"], ["GWA", "Gwalior"], ["DHU", "Dhundhar"], ["KSH", "Kashmir"], ["KLN", "Keladi"], ["KHD", "Khandesh"], ["ODH", "Oudh"],
  ["VND", "Venad"], ["MAB", "Malabar"], ["MEW", "Mewat"], ["BDA", "Baroda"], ["BST", "Bastar"], ["BHU", "Bhutan"], ["BND", "Bundelkhand"], ["CEY", "Ceylon"], ["JSL", "Jaisalmer"], ["KAC", "Kachar"],
  ["KMT", "Koch"], ["KGR", "Kangra"], ["KAT", "Kathiawar"], ["KOC", "Kochin"], ["MLB", "Manipur"], ["HAD", "Hadoti"], ["NGA", "Nagaur"], ["RMP", "Rohilkandh"], ["LDK", "Ladakh"], ["BGL", "Bagelkhand"],
  ["JFN", "Jaffna"], ["PTA", "Patiala"], ["GHR", "Garhwal"], ["CHD", "Chanda"], ["NGP", "Jharkhand"], ["JAJ", "Janjira"], ["TRT", "Tirhut"], ["CMP", "RewaKantha"], ["BGA", "Baglana"], ["TPR", "Tripura"],
  ["SDY", "Sadiya"], ["BHA", "Bharat"], ["YOR", "Andhra"], ["DGL", "Maldives"], ["MBL", "Bishnupur"], ["SKK", "Sikkim"], ["IDR", "Idar"], ["JLV", "Jhalavad"], ["PTL", "Palitana"], ["NVR", "Navanagar"],
  ["RJK", "Rajkot"], ["JGD", "Junagarh"], ["PRB", "Porbandar"], ["PAN", "Panna"], ["KLP", "Kalpi"], ["SBP", "Sambalpur"], ["PTT", "Patna"], ["RTT", "Ratanpur"], ["KLH", "Kalahandi"], ["KJH", "Keonhjar"],
  ["PRD", "Parlakhimidi"], ["JPR", "Jeypore"], ["SRG", "Surguja"], ["KND", "Kandy"], ["TLG", "Telingana"], ["KLT", "Kolathunad"], ["DNG", "Dang"], ["DTI", "Doti"], ["GRK", "Gorkha"], ["JML", "Jumla"],
  ["LWA", "Limbuwan"], ["MKP", "Makwanpur"], ["SRM", "Sirmur"], ["KTU", "Kathmandu"], ["KMN", "Kumaon"], ["GNG", "Gingee"], ["TNJ", "Tanjore"], ["SRH", "Sirhind"], ["RJP", "Rajputana"], ["BAR", "Bar"],
  ["HSA", "Hansa"], ["SMO", "Smolensk"], ["NZH", "NizhnyNovgorod"], ["KOJ", "Jerusalem"], ["MSA", "Malaya"], ["HIN", "Hindustan"], ["ABE", "Abenaki"], ["APA", "Apache"], ["ASI", "Assiniboine"], ["BLA", "Blackfoot"],
  ["CAD", "Caddo"], ["CHI", "Chickasaw"], ["CHO", "Choctaw"], ["CHY", "Cheyenne"], ["COM", "Comanche"], ["FOX", "Fox"], ["ILL", "Illinewek"], ["LEN", "Lenape"], ["MAH", "Mahican"], ["MIK", "Mikmaq"],
  ["MMI", "Miami"], ["NAH", "Navajo"], ["OJI", "Ojibwa"], ["OSA", "Osage"], ["OTT", "Ottawa"], ["PAW", "Pawnee"], ["PEQ", "Pequot"], ["PIM", "Pima"], ["POT", "Potawatomi"], ["POW", "Powhatan"],
  ["PUE", "Pueblo"], ["SHO", "Shoshone"], ["SIO", "Sioux"], ["SUS", "Susquehannock"], ["WCR", "Cree"], ["AIR", "Air"], ["BON", "Bonoman"], ["DAH", "Dahomey"], ["DGB", "Dagbon"], ["FUL", "Fulo"],
  ["JNN", "Jenne"], ["KAN", "Kano"], ["KBU", "Kaabu"], ["KNG", "Kong"], ["KTS", "Katsina"], ["MSI", "Mossi"], ["NUP", "Nupe"], ["TMB", "Timbuktu"], ["YAO", "Yao"], ["YAT", "Yatenga"],
  ["ZAF", "Zafunu"], ["ZZZ", "Zazzau"], ["NDO", "Ndongo"], ["AVA", "Ava"], ["HSE", "Hsenwi"], ["JOH", "Johor"], ["KED", "Kedah"], ["LIG", "Ligor"], ["MPH", "MuanPhuang"], ["MYA", "MongYang"],
  ["PRK", "Perak"], ["MMA", "MongMao"], ["MKA", "MongKawng"], ["MPA", "MongPai"], ["MNI", "MongNai"], ["KAL", "Kale"], ["HSI", "Hsipaw"], ["BPR", "Prome"], ["CHU", "Chukchi"], ["HOD", "Hodyntsy"],
  ["CHV", "Chavchuveny"], ["KMC", "Kamchadals"], ["BRT", "Buryats"], ["ARP", "Arapaho"], ["CLM", "Colima"], ["CNK", "Chinook"], ["COC", "Cocomes"], ["HDA", "Haida"], ["ITZ", "Itza"], ["KIC", "Kiche"],
  ["KIO", "Kiowa"], ["MIX", "Mixtec"], ["SAL", "Salish"], ["TAR", "Tarascan"], ["TLA", "Tlapanec"], ["TLX", "Tlaxcala"], ["TOT", "Totonac"], ["WIC", "Wichita"], ["XIU", "Xiu"], ["BLM", "Blambangan"],
  ["BTN", "Buton"], ["CRB", "Cirebon"], ["DMK", "Demak"], ["PGR", "Pagarruyung"], ["PLB", "Palembang"], ["PSA", "Pasai"], ["SAK", "Siak"], ["SUN", "Sunda"], ["KUT", "Kutai"], ["BNJ", "Banjar"],
  ["LFA", "Lanfang"], ["LNO", "Lanao"], ["LUW", "Luwu"], ["MGD", "Maguindanao"], ["TER", "Ternate"], ["TID", "Tidore"], ["MAS", "Madyaas"], ["PGS", "Pangasinan"], ["TDO", "Tondo"], ["MNA", "Maynila"],
  ["CEB", "Cebu"], ["BTU", "Butuan"], ["CSU", "Cusco"], ["CCQ", "Calchaqui"], ["MPC", "Mapuche"], ["MCA", "Muisca"], ["QTO", "Quito"], ["CJA", "Cajamarca"], ["HJA", "Huyla"], ["PTG", "Potiguara"],
  ["TPQ", "Tupiniquim"], ["TPA", "Tupinamba"], ["TUA", "Tapuia"], ["GUA", "Guarani"], ["CUA", "Charrua"], ["WKA", "Wanka"], ["CYA", "Chachapoya"], ["CLA", "Colla"], ["CRA", "Charca"], ["PCJ", "Pacajes"],
  ["ARW", "Arawak"], ["CAB", "Carib"], ["ICM", "Ichma"], ["MAT", "Matlatzinca"], ["COI", "Coixtlahuaca"], ["TEO", "Teotitlan"], ["XAL", "Xalisco"], ["GAM", "Guamar"], ["HST", "Huastec"], ["CCM", "Chichimeca"],
  ["OTO", "Otomi"], ["YOK", "Yokotan"], ["LAC", "Lacandon"], ["KAQ", "Kaqchikel"], ["CTM", "Chactemal"], ["KER", "Keres"], ["ZNI", "Zuni"], ["MSC", "Mescalero"], ["LIP", "Lipan"], ["CHT", "Chorti"],
  ["MIS", "Miskito"], ["TAI", "Tairona"], ["CNP", "Can Pech"], ["TON", "Tonallan"], ["YAQ", "Yaqui"], ["YKT", "Yokuts"], ["NSS", "New Providence"], ["PRY", "Port Royal"], ["TOR", "Tortuga"], ["LIB", "Libertatia"],
  ["JMN", "Jan Mayen"],["ROM", "RomanEmpire"], ["SYN", "Synthetics"]])
}

const test = new Campaign();