var React = require('react');

var AptList = React.createClass({
  handleAdd: function() {
    this.props.onAdd(this.props.whichItem);
  },
  handleInstructions: function() {
    this.props.onInstructions(this.props.whichItem);
  },  
  render: function() {
    return(
      <li className="pet-item media">
        <div className="media-left">
          <button className="pet-delete btn btn-xs btn-success" onClick={this.handleAdd}>Add</button>
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
});

module.exports = AptList;
