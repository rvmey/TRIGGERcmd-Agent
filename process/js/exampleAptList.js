import { withTranslation } from 'react-i18next';
var React = require('react');

// var AptList = React.createClass({

class AptList extends React.Component {
  constructor(props) {
    super(props);
    this.handleAdd = this.handleAdd.bind(this);
    this.handleInstructions = this.handleInstructions.bind(this);
  }

  handleAdd() {
    this.props.onAdd(this.props.whichItem);
  }
  handleInstructions() {
    this.props.onInstructions(this.props.whichItem);
  }  
  render() {
    const { t } = this.props;
    return(
      <li className="pet-item media">
        <div className="media-left">
          <button className="pet-delete btn btn-xs btn-success" onClick={this.handleAdd}>{t('Add')}</button>
        </div>
        <div className="pet-info media-body">
          <div className="pet-head">
            <span className="pet-name">{this.props.singleItem.name}</span>                        
            <span className="apt-date pull-right">{this.props.singleItem.voice}</span>
            <p></p>            
            <span className="apt-date pull-right">{this.props.singleItem.ground}</span>
          </div>
          <div className="owner-name"><span className="label-item">Command:</span>
          {this.props.singleItem.command}</div>          
          <div>
            <button className="apt-date btn btn-xs btn-info pull-left" onClick={this.handleInstructions}>Instructions</button>
            <span className="apt-date pull-right">{this.props.singleItem.os}</span>
          </div>
        </div>
      </li>
    )
  }
};

// module.exports = AptList;
module.exports = withTranslation()(AptList);