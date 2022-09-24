import i18next from "i18next";
import { initReactI18next } from "react-i18next";
var fs = eRequire('fs');
// import LanguageDetector from 'i18next-browser-languagedetector';

var lang;
try {
  lang = fs.readFileSync(languageLocation).toString();;
  console.log("Found " + lang + " in " + languageLocation);
} catch (err) {
  console.log("No language found in " + languageLocation + " using en.");
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
          "Add Command": "Add Command",
          "Browse Examples": "Browse Examples",
          "Computer List": "Computer List",
          "Operating System": "Operating System",
          "Cancel": "Cancel",
          "Allow Parameters": "Allow Parameters",
          "Save": "Save",
          "Alexa or Google will say this when it runs (optional)": "Alexa or Google will say this when it runs (optional)",
          "How to use background commands": "How to use background commands",
          "How to use Off Command": "How to use Off Command",
          "Voice Reply": "Voice Reply",
          "Word you\'ll say to Alexa or Google (optional)": "Word you\'ll say to Alexa or Google (optional)",
          "If filled, runs instead of Command when off is the parameter": "If filled, runs instead of Command when off is the parameter",
          "Your command": "Your command",
          "Trigger name": "Trigger name",
          "Current Commands": "Current Commands"
        }
      },
      pt: {
        translation: {
          "Add Command": "Adicionar Comando",
          "Browse Examples": "Procurar Exemplos",
          "Computer List": "Lista de Computadores",
          "Operating System": "Sistema Operacional",
          "Cancel": "Cancelar",
          "Allow Parameters": "Permitir Parâmetros",
          "Save": "Salvar",
          "Alexa or Google will say this when it runs (optional)": "Alexa ou Google dirá isso quando for executado (opcional)",
          "How to use background commands": "Como usar comandos em segundo plano",
          "How to use Off Command": "Como usar o comando Off",
          "Voice Reply": "Resposta de voz",
          "Word you\'ll say to Alexa or Google (optional)": "Palavra que você dirá para Alexa ou Google (opcional)",
          "If filled, runs instead of Command when off is the parameter": "Se preenchido, executa em vez de Command quando desligado é o parâmetro",
          "Your command": "Seu comando",
          "Trigger name": "Nome do gatilho",
          "Current Commands": "Comandos Atuais"
        }
      }
    }
  });


// import jquery from 'jquery';
// var $ = jquery;
// var jQuery = jquery;

var $ = require('jquery');
global.jQuery = require("jquery");
var _ = require('lodash');
var bootstrap = require('bootstrap');
var loadApts = JSON.parse(fs.readFileSync(dataLocation));

var electron = eRequire('electron');
var ipc = electron.ipcRenderer;

var React = require('react');
var ReactDOM = require('react-dom');
var cp = eRequire('child_process');
var os = require('os');
var AptList = require('./AptList');
var Toolbar = require('./Toolbar');
var HeaderNav = require('./HeaderNav');
var AddAppointment = require('./AddAppointment');
var EditAppointment = require('./EditAppointment');

// var MainInterface = React.createClass({  
class MainInterface extends React.Component {
  constructor(props) {
    super(props);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentWillUnmount = this.componentWillUnmount.bind(this);
    this.componentDidUpdate = this.componentDidUpdate.bind(this);
    this.toggleAptDisplay = this.toggleAptDisplay.bind(this);
    this.toggleEditDisplay = this.toggleEditDisplay.bind(this);
    this.onTriggerChange = this.onTriggerChange.bind(this);
    this.onCommandChange = this.onCommandChange.bind(this);
    this.onOffCommandChange = this.onOffCommandChange.bind(this);
    this.onGroundChange = this.onGroundChange.bind(this);
    this.onVoiceChange = this.onVoiceChange.bind(this);
    this.onVoiceReplyChange = this.onVoiceReplyChange.bind(this);
    this.onAllowParamsChange = this.onAllowParamsChange.bind(this);
    this.changeItem = this.changeItem.bind(this);
    this.browseExamples = this.browseExamples.bind(this);
    this.openComputerList = this.openComputerList.bind(this);
    this.openGroundInstructions = this.openGroundInstructions.bind(this);
    this.openOffCommandInstructions = this.openOffCommandInstructions.bind(this);
    this.addItem = this.addItem.bind(this);
    this.deleteMessage = this.deleteMessage.bind(this);
    this.runCommand = this.runCommand.bind(this);
    this.reOrder = this.reOrder.bind(this);
    this.searchApts = this.searchApts.bind(this);
    this.state = {
      operatingSystem: '',  // added here because it wouldn't detect the OS in the render function
      aptBodyVisible: false,
      editBodyVisible: false,
      orderBy: 'trigger',
      orderDir: 'asc',
      queryText: '',
      editTrigger: '',
      editCommand: '',
      editOffCommand: '',
      editGround: '',
      editVoice: '',
      editVoiceReply: '',
      editKey: null,
      myAppointments: loadApts
    };
  }

  // getInitialState() {
  //   return {
  //     operatingSystem: '',  // added here because it wouldn't detect the OS in the render function
  //     aptBodyVisible: false,
  //     editBodyVisible: false,
  //     orderBy: 'trigger',
  //     orderDir: 'asc',
  //     queryText: '',
  //     editTrigger: '',
  //     editCommand: '',
  //     editOffCommand: '',
  //     editGround: '',
  //     editVoice: '',
  //     editVoiceReply: '',
  //     editKey: null,
  //     myAppointments: loadApts
  //   }//return
  // } //getInitialState

  componentDidMount() {
    ipc.on('addAppointment', function(event,message) {
      this.toggleAptDisplay();
    }.bind(this));

    ipc.on('editAppointment', function(event,message) {
      this.toggleEditDisplay();
    }.bind(this));
  } //componentDidMount

  componentWillUnmount() {
    ipc.removeListener('addAppointment', function(event,message) {
      this.toggleAptDisplay();
    }.bind(this));

    ipc.removeListener('editAppointment', function(event,message) {
      this.toggleEditDisplay();
    }.bind(this));
  } //componentDidMount

  componentDidUpdate() {
    if ((this.state.aptBodyVisible == false) && (this.state.editBodyVisible == false)) {
      console.log('Neither add nor edit box visible, so updating file');

      function replacer(key, value) {
        // Filtering out properties
        if (key === 'mykey') {
          return undefined;
        }
        return value;
      }
      writeFileTransactional (dataLocation, JSON.stringify(this.state.myAppointments, replacer, 1), function(err) {
        if (err) {
          console.log(err);
        }
      });
    }
  } //componentDidUpdate

  toggleAptDisplay() {
    var tempVisibility = !this.state.aptBodyVisible;
    this.setState({
      aptBodyVisible: tempVisibility,
      editAllowParams: false
    }); //setState
  } //toggleAptDisplay

  toggleEditDisplay(item) {
    var tempVisibility = !this.state.editBodyVisible;
    this.setState({
      editBodyVisible: tempVisibility,
      editTrigger: item.trigger,
      editCommand: item.command,
      editOffCommand: item.offCommand,
      editGround: item.ground,
      editVoice: item.voice,
      editVoiceReply: item.voiceReply,
      editAllowParams: item.allowParams,
      editKey: item.mykey
    }); //setState
  } //toggleAptDisplay

  onTriggerChange(value) {
    this.setState({
      editTrigger: value
    }); //setState
  }
  onCommandChange(value) {
    this.setState({
      editCommand: value
    }); //setState
  }
  onOffCommandChange(value) {
    this.setState({
      editOffCommand: value
    }); //setState
  }
  onGroundChange(value) {
    this.setState({
      editGround: value
    }); //setState
  }
  onVoiceChange(value) {
    this.setState({
      editVoice: value
    }); //setState
  }
  onVoiceReplyChange(value) {
    this.setState({
      editVoiceReply: value
    }); //setState
  }
  onAllowParamsChange(value) {
    this.setState({
      editAllowParams: value
    }); //setState
  }

  changeItem(item) {
    var allApts = this.state.myAppointments;
    var newApts = _.without(allApts, this.state.myAppointments[item.mykey]);

    var tempItem = {
      trigger: this.state.editTrigger,
      command: this.state.editCommand,
      offCommand: this.state.editOffCommand,
      ground: this.state.editGround,
      voice: this.state.editVoice,
      voiceReply: this.state.editVoiceReply,
      allowParams: this.state.editAllowParams,
      mykey: item.mykey
    } //tempitems

    newApts.push(tempItem);

    var tempVisibility = !this.state.editBodyVisible;
    this.setState({
      editBodyVisible: tempVisibility,
      myAppointments: newApts,
      aptBodyVisible: false
    }) //setState
  } //changeItem

  browseExamples(e) {
    ipc.sendSync('openexampleWindow');
  } //browseExamples

  openComputerList(e) {
    electron.shell.openExternal('https://www.triggercmd.com/user/computer/list');
  } //openComputerList

  openGroundInstructions(e) {
    electron.shell.openExternal('https://www.triggercmd.com/forum/topic/15/what-s-the-difference-between-background-and-foreground-commands');
  } 

  openOffCommandInstructions(e) {
    electron.shell.openExternal('https://www.triggercmd.com/forum/topic/853/how-to-use-off-command');
  } 

  addItem(tempItem) {
    var tempApts = this.state.myAppointments;
    tempApts.push(tempItem);
    this.setState({
      myAppointments: tempApts,
      aptBodyVisible: false
    }) //setState
  } //addItem

  deleteMessage(item) {
    var allApts = this.state.myAppointments;
    var newApts = _.without(allApts, item);
    this.setState({
      myAppointments: newApts
    }); //setState
  } //deleteMessage

  runCommand(item) {
    console.log('Running ' + item.command);
    var ChildProcess = cp.exec(item.command);
  } //runCommand

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

    if(this.state.editBodyVisible === true) {
      $('#editAppointment').modal('show');
    } else {
      $('#editAppointment').modal('hide');
    }
    for (var i = 0; i < myAppointments.length; i++) {
      if (
        (myAppointments[i].trigger && myAppointments[i].trigger.toLowerCase().indexOf(queryText)!=-1) ||
        (myAppointments[i].command && myAppointments[i].command.toLowerCase().indexOf(queryText)!=-1) ||
        (myAppointments[i].voice && myAppointments[i].voice.toLowerCase().indexOf(queryText)!=-1)

      ) {
        filteredApts.push(myAppointments[i]);
      }
    }

    for (var i = 0; i < myAppointments.length; i++) {
        myAppointments[i].mykey = i;
    }

    filteredApts = _.orderBy(filteredApts, function(item) {
      return item[orderBy].toLowerCase();
    }, orderDir); // order array

    filteredApts=filteredApts.map(function(item, index) {
      return(
        <AptList key = {index}
          singleItem = {item}
          whichItem =  {item}
          onDelete = {this.deleteMessage}
          onEdit = {this.toggleEditDisplay}
          onRun = {this.runCommand}
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
            handleBrowse = {this.browseExamples}
            handleAbout = {this.showAbout}
            handleComputerList = {this.openComputerList}
          />
          <AddAppointment
            handleToggle = {this.toggleAptDisplay}
            handleGroundInstructions = {this.openGroundInstructions}
            handleOffCommandInstructions = {this.openOffCommandInstructions}
            addApt = {this.addItem}
            operatingSystem = {this.state.operatingSystem}
            editTrigger = {this.state.editTrigger}
            editCommand = {this.state.editCommand}
            editOffCommand = {this.state.editOffCommand}
            editGround = {this.state.editGround}
            editVoice = {this.state.editVoice}
            editVoiceReply = {this.state.editVoiceReply}
            editAllowParams = {this.state.editAllowParams}
            onTriggerChange = {this.onTriggerChange}
            onCommandChange = {this.onCommandChange}
            onOffCommandChange = {this.onOffCommandChange}
            onGroundChange = {this.onGroundChange}
            onVoiceChange = {this.onVoiceChange}
            onVoiceReplyChange = {this.onVoiceReplyChange}
            onAllowParamsChange = {this.onAllowParamsChange}
          />
          <EditAppointment
            operatingSystem = {this.state.operatingSystem}
            handleToggle = {this.toggleEditDisplay}
            handleGroundInstructions = {this.openGroundInstructions}
            handleOffCommandInstructions = {this.openOffCommandInstructions}
            editApt = {this.changeItem}
            editTrigger = {this.state.editTrigger}
            editCommand = {this.state.editCommand}
            editOffCommand = {this.state.editOffCommand}
            editGround = {this.state.editGround}
            editVoice = {this.state.editVoice}
            editVoiceReply = {this.state.editVoiceReply}
            editAllowParams = {this.state.editAllowParams}
            editKey = {this.state.editKey}
            onTriggerChange = {this.onTriggerChange}
            onCommandChange = {this.onCommandChange}
            onOffCommandChange = {this.onOffCommandChange}
            onGroundChange = {this.onGroundChange}
            onVoiceChange = {this.onVoiceChange}
            onVoiceReplyChange = {this.onVoiceReplyChange}
            onAllowParamsChange = {this.onAllowParamsChange}
          />
          <div className="container">
           <div className="row">
             <div className="appointments col-sm-12">
               <h2 className="appointments-headline">{i18next.t('Current Commands')}</h2>
               <ul className="item-list media-list">{filteredApts}</ul>
             </div>{/* col-sm-12 */}
           </div>{/* row */}
          </div>{/* container */}
        </div>{/* interface */}
      </div>
    );
  } //render
};//MainInterface

ReactDOM.render(
  <MainInterface />,
  document.getElementById('petAppointments')
); //render

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
