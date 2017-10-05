var React = require('react');

var Toolbar = React.createClass({

  createAppointments: function() {
    this.props.handleToggle();
  }, //createAppointments

  browseExamples: function() {
    this.props.handleBrowse();
  }, //createAppointments

  toggleAbout: function() {
    this.props.handleAbout();
  }, //toggleAbout

  computerList: function() {
    this.props.handleComputerList();
  }, //computerlist

  render: function() {
    return(
      <div className="toolbar">
        <div className="toolbar-item" onClick={this.createAppointments}>
          <span className="toolbar-item-button glyphicon glyphicon-plus-sign"></span>
          <span className="toolbar-item-text">Add Command</span>
        </div>
        <div className="toolbar-item" onClick={this.browseExamples}>
          <span className="toolbar-item-button glyphicon glyphicon-plus-sign"></span>
          <span className="toolbar-item-text">Browse Examples</span>
        </div>
        <div className="toolbar-item" onClick={this.computerList}>
          <span className="toolbar-item-button glyphicon glyphicon-plus-sign"></span>
          <span className="toolbar-item-text">Computer List</span>
        </div>        
      </div>
    ) //return

  } //render
}); //Toolbar

module.exports = Toolbar;
