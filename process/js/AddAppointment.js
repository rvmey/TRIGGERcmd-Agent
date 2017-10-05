var React = require('react');

var AddAppointment = React.createClass({

  toggleAptDisplay: function() {
    this.props.handleToggle();
  },

  handleAdd: function(e) {
    e.preventDefault();
    var tempItem = {
      trigger: this.inputPetName.value,
      command: this.inputPetOwner.value,
      ground: this.inputAptDate.value,
      voice: this.inputAptNotes.value,
      allowParams: this.inputAllowParams.value,
    } //tempitems

    this.props.addApt(tempItem);

    this.inputPetName.value = '';
    this.inputPetOwner.value = '';
    this.inputAptDate.value = 'foreground';
    this.inputAptNotes.value = '';
    this.inputAllowParams.value = 'false';
  }, //handleAdd

  render: function() {
    return(
      <div className="modal fade" id="addAppointment" tabIndex="-1" role="dialog">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close" onClick={this.toggleAptDisplay} aria-label="Close"><span aria-hidden="true">&times;</span></button>
              <h4 className="modal-title">Add a command</h4>
            </div>

            <form className="modal-body add-appointment form-horizontal" onSubmit={this.handleAdd}>
              <div className="form-group">
                <label className="col-sm-3 control-label" htmlFor="petName">Trigger</label>
                <div className="col-sm-9">
                  <input type="text" className="form-control"
                    id="petName" ref={(ref) => this.inputPetName = ref } placeholder="Trigger name" required/>
                </div>
              </div>
              <div className="form-group">
                <label className="col-sm-3 control-label" htmlFor="petOwner">Command</label>
                <div className="col-sm-9">
                  <input type="text" className="form-control"
                    id="petOwner"  ref={(ref) => this.inputPetOwner = ref } placeholder="Your command" required/>
                </div>
              </div>
              <div className="form-group">
                <label className="col-sm-3 control-label" htmlFor="aptDate">Ground</label>
                <div className="col-sm-9">
                  <select id="mySelect" className="form-control" id="aptDate"  ref={(ref) => this.inputAptDate = ref }  >
                    <option>foreground</option>
                    <option>background</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="col-sm-3 control-label" htmlFor="aptNotes">Voice</label>
                <div className="col-sm-9">
                  <input type="text" className="form-control"
                    id="aptNotes"  ref={(ref) => this.inputAptNotes = ref } placeholder="Voice word for Alexa or Google Assistant (optional)" />
                </div>
              </div>
              <div className="form-group">
                <label className="col-sm-3 control-label" htmlFor="allowParams">Allow Parameters</label>
                <div className="col-sm-9">
                  <select id="mySelect" className="form-control" id="allowParams"  ref={(ref) => this.inputAllowParams = ref }  >
                    <option>false</option>
                    <option>true</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <div className="col-sm-offset-3 col-sm-9">
                  <div className="pull-right">
                    <button type="button" className="btn btn-default"  onClick={this.toggleAptDisplay}>Cancel</button>&nbsp;
                    <button type="submit" className="btn btn-primary">Save</button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    ) //return
  } //render
}); //AddAppointment

module.exports=AddAppointment;
