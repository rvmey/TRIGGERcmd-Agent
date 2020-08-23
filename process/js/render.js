var $ = jQuery = require('jquery');
var _ = require('lodash');
var bootstrap = require('bootstrap');
var fs = eRequire('fs');
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

var MainInterface = React.createClass({  
  getInitialState: function() {    
    return {
      operatingSystem: operatingSystem,  // added here because it wouldn't detect the OS in the render function
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
    }//return
  }, //getInitialState

  componentDidMount: function() {
    ipc.on('addAppointment', function(event,message) {
      this.toggleAptDisplay();
    }.bind(this));

    ipc.on('editAppointment', function(event,message) {
      this.toggleEditDisplay();
    }.bind(this));
  }, //componentDidMount

  componentWillUnmount: function() {
    ipc.removeListener('addAppointment', function(event,message) {
      this.toggleAptDisplay();
    }.bind(this));

    ipc.removeListener('editAppointment', function(event,message) {
      this.toggleEditDisplay();
    }.bind(this));
  }, //componentDidMount

  componentDidUpdate: function() {
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
  }, //componentDidUpdate

  toggleAptDisplay: function() {
    var tempVisibility = !this.state.aptBodyVisible;
    this.setState({
      aptBodyVisible: tempVisibility,
      editAllowParams: false
    }); //setState
  }, //toggleAptDisplay

  toggleEditDisplay: function(item) {
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
  }, //toggleAptDisplay

  onTriggerChange: function(value) {
    this.setState({
      editTrigger: value
    }); //setState
  },
  onCommandChange: function(value) {
    this.setState({
      editCommand: value
    }); //setState
  },
  onOffCommandChange: function(value) {
    this.setState({
      editOffCommand: value
    }); //setState
  },
  onGroundChange: function(value) {
    this.setState({
      editGround: value
    }); //setState
  },
  onVoiceChange: function(value) {
    this.setState({
      editVoice: value
    }); //setState
  },
  onVoiceReplyChange: function(value) {
    this.setState({
      editVoiceReply: value
    }); //setState
  },
  onAllowParamsChange: function(value) {
    this.setState({
      editAllowParams: value
    }); //setState
  },

  changeItem: function(item) {
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
  }, //changeItem

  browseExamples: function() {
    ipc.sendSync('openexampleWindow');
  }, //browseExamples

  openComputerList: function() {
    electron.shell.openExternal('https://www.triggercmd.com/user/computer/list');
  }, //openComputerList

  openGroundInstructions: function() {
    electron.shell.openExternal('https://www.triggercmd.com/forum/topic/15/what-s-the-difference-between-background-and-foreground-commands');
  }, 

  addItem: function(tempItem) {    
    var tempApts = this.state.myAppointments;
    tempApts.push(tempItem);
    this.setState({
      myAppointments: tempApts,
      aptBodyVisible: false
    }) //setState
  }, //addItem

  deleteMessage: function(item) {
    var allApts = this.state.myAppointments;
    var newApts = _.without(allApts, item);
    this.setState({
      myAppointments: newApts
    }); //setState
  }, //deleteMessage

  runCommand: function(item) {
    console.log('Running ' + item.command);
    var ChildProcess = cp.exec(item.command);
  }, //runCommand

  reOrder: function(orderBy, orderDir) {
    this.setState({
      orderBy: orderBy,
      orderDir: orderDir
    }) //setState
  }, //reOrder

  searchApts: function(query) {
    this.setState({
      queryText: query
    }); //setState
  }, //searchApts

  render: function() {
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
        (myAppointments[i].trigger.toLowerCase().indexOf(queryText)!=-1) ||
        (myAppointments[i].command.toLowerCase().indexOf(queryText)!=-1) ||
        (myAppointments[i].ground.toLowerCase().indexOf(queryText)!=-1) ||
        (myAppointments[i].voice.toLowerCase().indexOf(queryText)!=-1)

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
               <h2 className="appointments-headline">Current Commands</h2>
               <ul className="item-list media-list">{filteredApts}</ul>
             </div>{/* col-sm-12 */}
           </div>{/* row */}
          </div>{/* container */}
        </div>{/* interface */}
      </div>
    );
  } //render
});//MainInterface

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
