import { withTranslation } from 'react-i18next';

var React = require('react');

// var Toolbar = React.createClass({

class Toolbar extends React.Component {
  constructor(props) {
    super(props);
    this.createAppointments = this.createAppointments.bind(this);
    this.browseExamples = this.browseExamples.bind(this);
    this.toggleAbout = this.toggleAbout.bind(this);
    this.computerList = this.computerList.bind(this);

  }
  
  createAppointments(e) {
    this.props.handleToggle();
  } //createAppointments

  browseExamples(e) {
    this.props.handleBrowse();
  } //createAppointments

  toggleAbout(e) {
    this.props.handleAbout();
  } //toggleAbout

  computerList(e) {
    this.props.handleComputerList();
  } //computerlist
  
  render() {
    const { t } = this.props;
    return(
      <div className="toolbar">
        <div className="toolbar-item" onClick={this.createAppointments}>
          <span className="toolbar-item-button glyphicon glyphicon-plus-sign"></span>
          <span className="toolbar-item-text">{t('Add Command')}</span>
        </div>
        <div className="toolbar-item" onClick={this.browseExamples}>
          <span className="toolbar-item-button glyphicon glyphicon-plus-sign"></span>
          <span className="toolbar-item-text">{t('Browse Examples')}</span>
        </div>
        <div className="toolbar-item" onClick={this.computerList}>
          <span className="toolbar-item-button glyphicon glyphicon-plus-sign"></span>
          <span className="toolbar-item-text">{t('Computer List')}</span>
        </div>        
      </div>
    ) //return

  } //render
}; //Toolbar

// module.exports = Toolbar;
// export default withTranslation()(Toolbar);
module.exports = withTranslation()(Toolbar);
