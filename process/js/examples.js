var $ = jQuery = require('jquery');
var _ = require('lodash');
var bootstrap = require('bootstrap');
var fs = eRequire('fs');
var loadApts = JSON.parse(fs.readFileSync(dataLocation));
// var loadCmds = JSON.parse(fs.readFileSync(cmdLocation));

var electron = eRequire('electron');
var ipc = electron.ipcRenderer;

var React = require('react');
var ReactDOM = require('react-dom');
var AptList = require('./exampleAptList');
var Toolbar = require('./exampleToolbar');
var HeaderNav = require('./exampleHeaderNav');
var AddAppointment = require('./AddAppointment');

var MainInterface = React.createClass({
  getInitialState: function() {
    return {
      aptBodyVisible: false,
      orderBy: 'name',
      orderDir: 'asc',
      queryText: '',
      myAppointments: loadApts,
      // myCmds: loadCmds
    }//return
  }, //getInitialState

  componentDidMount: function() {
    ipc.on('addAppointment', function(event,message) {
      this.toggleAptDisplay();
    }.bind(this));
  }, //componentDidMount

  componentWillUnmount: function() {
    ipc.removeListener('addAppointment', function(event,message) {
      this.toggleAptDisplay();
    }.bind(this));
  }, //componentDidMount

  componentDidUpdate: function() {
    if (!this.state.aptBodyVisible) {
      fs.writeFileSync(dataLocation, JSON.stringify(this.state.myAppointments, undefined, 1), 'utf8', function(err) {
        if (err) {
          console.log(err);
        }
      });//writeFile
    }    
  }, //componentDidUpdate

  toggleAptDisplay: function() {
    var tempVisibility = !this.state.aptBodyVisible;
    this.setState({
      aptBodyVisible: tempVisibility
    }); //setState
  }, //toggleAptDisplay

  // reloadCommands:function() {
    // console.log("reloadCommands function in examples.js ran, ipc.sendSync exampleAdded")
    // ipc.sendSync('exampleAdded');
  // }, //reloadCommands

  publishOwn:function() {
    electron.shell.openExternal('https://www.triggercmd.com/forum/category/3/example-commands')
  },

  onlineInstructions:function(item) {
    electron.shell.openExternal(item.url)
  },

  addItem: function(item) {
    var loadCmds = JSON.parse(fs.readFileSync(cmdLocation));

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

    fs.writeFileSync(cmdLocation, JSON.stringify(tempCmds, undefined, 1), 'utf8', function(err) {
      if (err) {
        console.log(err);
      }
    });//writeFile

    console.log("reloadCommands function in examples.js ran, ipc.sendSync exampleAdded")
    ipc.sendSync('exampleAdded');
  }, //addItem

  deleteMessage: function(item) {
    var allApts = this.state.myAppointments;
    var newApts = _.without(allApts, item);
    this.setState({
      myAppointments: newApts
    }); //setState
  }, //addMessage
  
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
               <h2 className="appointments-headline">Example Commands</h2>
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
