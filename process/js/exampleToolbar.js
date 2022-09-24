import { withTranslation } from 'react-i18next';
var React = require('react');

// var Toolbar = React.createClass({
class Toolbar extends React.Component {
  constructor(props) {
    super(props);
    this.publishOwn = this.publishOwn.bind(this);
    this.toggleAbout = this.toggleAbout.bind(this);
  }

  publishOwn() {
    this.props.handlePublish();
  } //publishOwn 

  toggleAbout() {
    this.props.handleAbout();
  } //toggleAbout

  render() {
    const { t } = this.props;
    return(
      <div className="toolbar">
        <div className="toolbar-item" onClick={this.publishOwn}>
          <span className="toolbar-item-button glyphicon glyphicon-plus-sign"></span>
          <span className="toolbar-item-text">{t('Publish Your Own Example')}</span>
        </div>
      </div>
    ) //return
  } //render
}; //Toolbar

// module.exports = Toolbar;
module.exports = withTranslation()(Toolbar);