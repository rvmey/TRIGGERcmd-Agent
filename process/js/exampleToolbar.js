var React = require('react');

var Toolbar = React.createClass({

  publishOwn: function() {
    this.props.handlePublish();
  }, //publishOwn 

  toggleAbout: function() {
    this.props.handleAbout();
  }, //toggleAbout

  render: function() {
    return(
      <div className="toolbar">
        <div className="toolbar-item" onClick={this.publishOwn}>
          <span className="toolbar-item-button glyphicon glyphicon-plus-sign"></span>
          <span className="toolbar-item-text">Publish Your Own Example</span>
        </div>
      </div>
    ) //return
  } //render
}); //Toolbar

module.exports = Toolbar;
