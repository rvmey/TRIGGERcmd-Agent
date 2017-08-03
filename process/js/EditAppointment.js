var React = require('react');

// var EditAppointment = React.createClass({

class EditAppointment extends React.Component {
  constructor(props) {
    super(props);
    this.handleTriggerChange = this.handleTriggerChange.bind(this);
    this.handleCommandChange = this.handleCommandChange.bind(this);
    this.handleGroundChange = this.handleGroundChange.bind(this);
    this.handleVoiceChange = this.handleVoiceChange.bind(this);
    this.toggleAptDisplay = this.toggleAptDisplay.bind(this);
    this.handleEdit = this.handleEdit.bind(this);
  }

  toggleAptDisplay(e) {
    this.props.handleToggle(e);
  }

  handleEdit(e) {
    e.preventDefault();
    var tempItem = {
      trigger: this.inputPetName.value,
      command: this.inputPetOwner.value,
      ground: this.inputAptDate.value,
      voice: this.inputAptNotes.value,
      mykey: this.props.editKey
    } //tempitems

    this.props.editApt(tempItem);
    
  } //handleEdit

  handleTriggerChange(e) {
    this.props.onTriggerChange(e.target.value);
  }

  handleCommandChange(e) {
    this.props.onCommandChange(e.target.value);
  }

  handleGroundChange(e) {
    this.props.onGroundChange(e.target.value);
  }

  handleVoiceChange(e) {
    this.props.onVoiceChange(e.target.value);
  }

  render() {
    const triggervalue = this.props.editTrigger;
    const commandvalue = this.props.editCommand;
    const groundvalue = this.props.editGround;
    const voicevalue = this.props.editVoice;    
    return(
      <div className="modal fade" id="editAppointment" tabIndex="-1" role="dialog">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close" onClick={this.toggleAptDisplay} aria-label="Close"><span aria-hidden="true">&times;</span></button>
              <h4 className="modal-title">Edit a command</h4>
            </div>

            <form className="modal-body edit-appointment form-horizontal" onSubmit={this.handleEdit}>
              <div className="form-group">
                <label className="col-sm-3 control-label" htmlFor="petName">Trigger</label>
                <div className="col-sm-9">
                  <input type="text" className="form-control"
                    id="petName" ref={(ref) => this.inputPetName = ref } placeholder="Trigger name" onChange={this.handleTriggerChange} value={triggervalue} required/>
                </div>
              </div>
              <div className="form-group">
                <label className="col-sm-3 control-label" htmlFor="petOwner">Command</label>
                <div className="col-sm-9">
                  <input type="text" className="form-control"
                    id="petOwner"  ref={(ref) => this.inputPetOwner = ref } placeholder="Your command" onChange={this.handleCommandChange} value={commandvalue} required/>
                </div>
              </div>
              <div className="form-group">
                <label className="col-sm-3 control-label" htmlFor="aptDate">Ground</label>
                <div className="col-sm-9">                  
                  <select id="mySelect" className="form-control" id="aptDate"  ref={(ref) => this.inputAptDate = ref } onChange={this.handleGroundChange} value={groundvalue} >
                    <option>foreground</option>
                    <option>background</option>
                  </select>
                </div>
              </div>              
              <div className="form-group">
                <label className="col-sm-3 control-label" htmlFor="aptNotes">Voice</label>
                <div className="col-sm-9">
                  <input type="text" className="form-control"
                    id="aptNotes"  ref={(ref) => this.inputAptNotes = ref } placeholder="Voice word for Alexa or Google Assistant (optional)" onChange={this.handleVoiceChange} value={voicevalue} />                  
                </div>
              </div>
              <div className="form-group">
                <div className="col-sm-offset-3 col-sm-9">
                  <div className="pull-right">
                    <button type="button" className="btn btn-default"  onClick={this.toggleAptDisplay}>Cancel</button>&nbsp;
                    <button type="submit" className="btn btn-primary">Edit Command</button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    ) //return
  } //render
}; //EditAppointment

module.exports=EditAppointment;
