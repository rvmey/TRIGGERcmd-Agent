import i18next from "i18next";
import { initReactI18next } from "react-i18next";
const fs = window.require ? window.require('fs') : require('fs');
// import LanguageDetector from 'i18next-browser-languagedetector';

var lang;
try {
  lang = fs.readFileSync(window.languageLocation).toString();;
  console.log("Found " + lang + " in " + window.languageLocation);
} catch (err) {
  console.log(err);
  console.log("No language found in " + window.languageLocation + " using en.");
  lang = 'en';
}

i18next
  .use(initReactI18next)
  .init({
    lng: lang,
    fallbackLng: 'en',
    debug: false,
    react: {
      useSuspense: true
    },
    resources: {
      en: {
        translation: {
          "Add": "Add",
          "Publish Your Own Example": "Publish Your Own Example",
          "Operating System": "Operating System",
          "Example Commands": "Example Commands"
        }
      },
      pt: {
        translation: {
          "Add": "Adicionar",
          "Publish Your Own Example": "Publique Seu Próprio Exemplo",
          "Operating System": "Sistema Operacional",
          "Example Commands": "Comandos de Exemplo"
        }
      },
      es: {
        translation: {
          "Add": "Agregar",
          "Publish Your Own Example": "Publica tu propio ejemplo",
          "Operating System": "Publica tu propio ejemplo",
          "Example Commands": "Comandos de ejemplo"
        }
      },
      de: {
        translation: {
          "Add": "Hinzufügen",
          "Publish Your Own Example": "Veröffentlichen Sie Ihr eigenes Beispiel",
          "Operating System": "Betriebssystem",
          "Example Commands": "Beispielbefehle"
        }
      },
      fr: {
        translation: {
          "Add": "Ajouter",
          "Publish Your Own Example": "Publiez votre propre exemple",
          "Operating System": "Système opérateur",
          "Example Commands": "Exemples de commandes"
        }
      },
      it: {
        translation: {
          "Add": "Aggiungere",
          "Publish Your Own Example": "Pubblica il tuo esempio",
          "Operating System": "Sistema operativo",
          "Example Commands": "Esempi di comandi"
        }
      },
      jp: {
        translation: {
          "Add": "追加",
          "Publish Your Own Example": "独自の例を公開する",
          "Operating System": "オペレーティング·システム",
          "Example Commands": "コマンド例"
        }
      }
    }
  });

var $ = require('jquery');
global.jQuery = require("jquery");
// var $ = jQuery = require('jquery');
var _ = require('lodash');
var bootstrap = require('bootstrap');
var loadApts = JSON.parse(fs.readFileSync(window.dataLocation));
// var loadCmds = JSON.parse(fs.readFileSync(cmdLocation));

var electron = window.require ? window.require('electron') : require('electron');
var ipc = electron.ipcRenderer;

var React = require('react');
var ReactDOM = require('react-dom/client');
var AptList = require('./exampleAptList');
var Toolbar = require('./exampleToolbar');
var HeaderNav = require('./exampleHeaderNav');
var AddAppointment = require('./AddAppointment');

// var MainInterface = React.createClass({
class MainInterface extends React.Component {
  constructor(props) {
    super(props);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentWillUnmount = this.componentWillUnmount.bind(this);
    this.componentDidUpdate = this.componentDidUpdate.bind(this);
    this.toggleAptDisplay = this.toggleAptDisplay.bind(this);
    this.publishOwn = this.publishOwn.bind(this);
    this.onlineInstructions = this.onlineInstructions.bind(this);
    this.addItem = this.addItem.bind(this);
    this.deleteMessage = this.deleteMessage.bind(this);
    this.reOrder = this.reOrder.bind(this);
    this.searchApts = this.searchApts.bind(this);
    this.state = {
      aptBodyVisible: false,
      orderBy: 'name',
      orderDir: 'asc',
      queryText: '',
      myAppointments: loadApts,
      // myCmds: loadCmds
    }
  }

  // getInitialState() {
  //   return {
  //     aptBodyVisible: false,
  //     orderBy: 'name',
  //     orderDir: 'asc',
  //     queryText: '',
  //     myAppointments: loadApts,
  //     // myCmds: loadCmds
  //   }//return
  // } //getInitialState

  componentDidMount() {
    ipc.on('addAppointment', function(event,message) {
      this.toggleAptDisplay();
    }.bind(this));
  } //componentDidMount

  componentWillUnmount() {
    ipc.removeListener('addAppointment', function(event,message) {
      this.toggleAptDisplay();
    }.bind(this));
  } //componentDidMount

  componentDidUpdate() {
    if (!this.state.aptBodyVisible) {
      fs.writeFileSync(window.dataLocation, JSON.stringify(this.state.myAppointments, undefined, 1), 'utf8', function(err) {
        if (err) {
          console.log(err);
        }
      });//writeFile
    }    
  } //componentDidUpdate

  toggleAptDisplay(e) {
    var tempVisibility = !this.state.aptBodyVisible;
    this.setState({
      aptBodyVisible: tempVisibility
    }); //setState
  } //toggleAptDisplay

  // reloadCommands:function() {
    // console.log("reloadCommands function in examples.js ran, ipc.sendSync exampleAdded")
    // ipc.sendSync('exampleAdded');
  // }, //reloadCommands

  publishOwn(e) {
    electron.shell.openExternal('https://www.triggercmd.com/forum/category/3/example-commands')
  }
  
  onlineInstructions(item) {
    electron.shell.openExternal(item.url)
  }

  addItem(item) {
    var loadCmds = JSON.parse(fs.readFileSync(window.cmdLocation));

    // console.log(item);
    // var tempCmds = this.state.myCmds;
    var tempCmds = loadCmds;
    var tempItem = {
      trigger: item.name,
      command: item.command,
      ground: item.ground,
      voice: item.voice,
    }
    tempCmds.push(tempItem);
    
    // this.setState({
      // myCmds: tempCmds,
      // aptBodyVisible: false
    // }) //setState

    /* fs.writeFileSync(cmdLocation, JSON.stringify(tempCmds, undefined, 1), 'utf8', function(err) {
      if (err) {
        console.log(err);
      }
    });//writeFile  */

    writeFileTransactional (window.cmdLocation, JSON.stringify(tempCmds, undefined, 1), function(err) {
      if (err) {
        console.log(err);
      }
    });

    console.log("reloadCommands function in examples.js ran, ipc.sendSync exampleAdded")
    ipc.sendSync('exampleAdded');
  } //addItem

  deleteMessage(item) {
    var allApts = this.state.myAppointments;
    var newApts = _.without(allApts, item);
    this.setState({
      myAppointments: newApts
    }); //setState
  } //addMessage
  
  reOrder(orderBy, orderDir) {
    this.setState({
      orderBy: orderBy,
      orderDir: orderDir
    }) //setState
  } //reOrder

  searchApts(query) {
    this.setState({
      queryText: query
    }); //setState
  } //searchApts

  render() {
    var filteredApts = [];
    var queryText = this.state.queryText;
    var orderBy = this.state.orderBy;
    var orderDir = this.state.orderDir;
    var myAppointments = this.state.myAppointments;

    if(this.state.aptBodyVisible === true) {
      $('#addAppointment').modal('show');
    } else {
      $('#addAppointment').modal('hide');
    }

    for (var i = 0; i < myAppointments.length; i++) {
      // console.log(myAppointments);
      if (        
        (myAppointments[i].name.toLowerCase().indexOf(queryText)!=-1) ||
        (myAppointments[i].command.toLowerCase().indexOf(queryText)!=-1) ||        
        (myAppointments[i].voice.toLowerCase().indexOf(queryText)!=-1)

      ) {
        filteredApts.push(myAppointments[i]);
      }
    }

    filteredApts = _.orderBy(filteredApts, function(item) {
      // console.log ('item:');
      // console.log (item);
      // console.log ('orderBy:');
      // console.log (orderBy);
      return item[orderBy].toLowerCase();
    }, orderDir); // order array

    filteredApts=filteredApts.map(function(item, index) {
      return(
        <AptList key = {index}
          singleItem = {item}
          whichItem =  {item}
          onAdd = {this.addItem}
          onInstructions = {this.onlineInstructions}          
        />
      ) // return
    }.bind(this)); //Appointments.map

    return(
      <div className="application">
        <HeaderNav
          orderBy = {this.state.orderBy}
          orderDir =  {this.state.orderDir}
          onReOrder = {this.reOrder}
          onSearch= {this.searchApts}
        />
        <div className="interface">
          <Toolbar
            handleToggle = {this.toggleAptDisplay}
            handleAbout = {this.showAbout}
            handlePublish = {this.publishOwn}
          />
          <AddAppointment
            handleToggle = {this.toggleAptDisplay}
            addApt = {this.addItem}
          />
          <div className="container">
           <div className="row">
             <div className="appointments col-sm-12">
               <h2 className="appointments-headline">{i18next.t('Example Commands')}</h2>
               <ul className="item-list media-list">{filteredApts}</ul>
             </div>{/* col-sm-12 */}
           </div>{/* row */}
          </div>{/* container */}
        </div>{/* interface */}
      </div>
    );
  } //render
};//MainInterface

const root = ReactDOM.createRoot(document.getElementById('petAppointments'));
root.render(<MainInterface />); //render

// Russ added this to fix a bug where the commands.json would get emptied sometimes.
function writeFileTransactional (path, content, cb) {    
    let temporaryPath = `${path}.new`;
    fs.writeFile(temporaryPath, content, 'utf8', function (err) {
        if (err) {
            return cb(err);
        }

        fs.rename(temporaryPath, path, cb);
    });
};