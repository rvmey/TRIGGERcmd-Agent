var React = require('react');

var HeaderNav = React.createClass({

  handleSort: function(e) {
    this.props.onReOrder(e.target.id, this.props.orderDir);
  }, //handleSort

  handleOrder: function(e) {
    this.props.onReOrder(this.props.orderBy, e.target.id);
  }, //handleOrder

  handleSearch: function(e) {
    this.props.onSearch(e.target.value);
  }, //handleSearch

  render: function() {
    return(
      <nav className="navigation navbar navbar-default">
        <div className="container-fluid">
          <div className="navbar-header"><a className="navbar-brand" href="#">TRIGGERcmd</a></div>
          <div className="navbar-form navbar-right search-appointments">
              <div className="input-group">
                <input id="SearchApts" onChange={this.handleSearch} placeholder="Search" autoFocus type="text" className="form-control" aria-label="Search Appointments" />
                <div className="input-group-btn">
                  <button type="button" className="btn btn-info dropdown-toggle"
                    data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Sort by: <span className="caret"></span></button>
                    <ul className="dropdown-menu dropdown-menu-right">
                      <li><a href="#" id="trigger" onClick={this.handleSort}>Trigger {(this.props.orderBy === 'trigger') ? <span className="glyphicon glyphicon-ok"></span>:null}</a></li>
                      <li><a href="#" id="command" onClick={this.handleSort}>Command {(this.props.orderBy === 'command') ? <span className="glyphicon glyphicon-ok"></span>:null}</a></li>
                      <li><a href="#" id="ground" onClick={this.handleSort}>Ground  {(this.props.orderBy === 'ground') ? <span className="glyphicon glyphicon-ok"></span>:null}</a></li>
                      <li role="separator" className="divider"></li>
                      <li><a href="#" id="asc" onClick={this.handleOrder}>Asc {(this.props.orderDir === 'asc') ? <span className="glyphicon glyphicon-ok"></span>:null}</a></li>
                      <li><a href="#" id="desc" onClick={this.handleOrder}>Desc {(this.props.orderDir === 'desc') ? <span className="glyphicon glyphicon-ok"></span>:null}</a></li>
                    </ul>
                </div>{/* input-group-btn */}
            </div>{/* input-group */}
          </div>{/* navbar-form */}
        </div>{/* container-fluid */}
      </nav>
    ) // return
  }//render
}); //HeaderNav

module.exports = HeaderNav;
