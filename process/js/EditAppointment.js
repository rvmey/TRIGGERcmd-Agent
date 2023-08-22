import { withTranslation } from 'react-i18next';
var React = require('react');

// var EditAppointment = React.createClass({

class EditAppointment extends React.Component {
  constructor(props) {
    super(props);
    this.handleTriggerChange = this.handleTriggerChange.bind(this);
    this.handleCommandChange = this.handleCommandChange.bind(this);
    this.handleOffCommandChange = this.handleOffCommandChange.bind(this);
    this.handleGroundChange = this.handleGroundChange.bind(this);
    this.handleVoiceChange = this.handleVoiceChange.bind(this);
    this.handleVoiceReplyChange = this.handleVoiceReplyChange.bind(this);
    this.handleAllowParamsChange = this.handleAllowParamsChange.bind(this);
    this.toggleAptDisplay = this.toggleAptDisplay.bind(this);
    this.groundInstructions = this.groundInstructions.bind(this);
    this.offCommandInstructions = this.offCommandInstructions.bind(this);
    this.handleEdit = this.handleEdit.bind(this);
  }

  toggleAptDisplay(e) {
    this.props.handleToggle(e);
  }

  groundInstructions(e) {
    this.props.handleGroundInstructions(e);
  }

  offCommandInstructions(e) {
    this.props.handleOffCommandInstructions(e);
  }

  handleEdit(e) {
    e.preventDefault();
    var tempItem = {
      trigger: this.inputPetName.value,
      command: this.inputPetOwner.value,
      offCommand: this.inputOffCommand.value,
      ground: this.inputAptDate.value,
      voice: this.inputAptNotes.value,
      voiceReply: this.inputVoiceReply.value,
      allowParams: this.inputAllowParams.value,
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

  handleOffCommandChange(e) {
    this.props.onOffCommandChange(e.target.value);
  } 

  handleGroundChange(e) {
    this.props.onGroundChange(e.target.value);
  }

  handleVoiceChange(e) {
    this.props.onVoiceChange(e.target.value);
  }

  handleVoiceReplyChange(e) {
    this.props.onVoiceReplyChange(e.target.value);
  }

  handleAllowParamsChange(e) {
    this.props.onAllowParamsChange(e.target.value);
  }

  render() {
    const { t } = this.props;

    const triggervalue = this.props.editTrigger || '';
    const commandvalue = this.props.editCommand || '';
    const offCommandvalue = this.props.editOffCommand || '';
    const groundvalue = this.props.editGround || 'foreground';
    const voicevalue = this.props.editVoice || '';
    const voiceReplyvalue = this.props.editVoiceReply || '';
    const allowParamsvalue = this.props.editAllowParams || false;
    
    var disableOffCommandField = true;
    if (allowParamsvalue == "true") {
      disableOffCommandField = false;
    }

    let groundOptions;
    if (this.props.operatingSystem == 'darwin') {
      groundOptions = <select id="mySelect" className="form-control" id="aptDate"  ref={(ref) => this.inputAptDate = ref } onChange={this.handleGroundChange} value={groundvalue} >
         <option>foreground</option>
      </select>   ;
    } else {
      groundOptions = <select id="mySelect" className="form-control" id="aptDate"  ref={(ref) => this.inputAptDate = ref } onChange={this.handleGroundChange} value={groundvalue} >
         <option>foreground</option>
         <option>background</option>
      </select>   ;
    }

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
                    id="petName" ref={(ref) => this.inputPetName = ref } placeholder={t('Trigger name')} onChange={this.handleTriggerChange} value={triggervalue} required/>
                </div>
              </div>
              <div className="form-group">
                <label className="col-sm-3 control-label" htmlFor="petOwner">Command</label>
                <div className="col-sm-9">
                  <input type="text" className="form-control"
                    id="petOwner"  ref={(ref) => this.inputPetOwner = ref } placeholder={t('Your command')} onChange={this.handleCommandChange} value={commandvalue} required/>
                </div>
              </div>
              <div className="form-group">
                <label className="col-sm-3 control-label" htmlFor="offCommand">Off Command</label>
                <div className="col-sm-9">
                  <input type="text" className="form-control" disabled={disableOffCommandField}
                    id="offCommand"  ref={(ref) => this.inputOffCommand = ref } placeholder={t('If filled, runs instead of Command when off is the parameter')} onChange={this.handleOffCommandChange} value={offCommandvalue} />
                  <button type="button" className="btn btn-link" onClick={this.offCommandInstructions} >{t('How to use Off Command')}</button>
                </div>
              </div>
              <div className="form-group">
                <label className="col-sm-3 control-label" htmlFor="aptDate">Ground</label>
                <div className="col-sm-9"> 
                  {groundOptions}                 
                  <button type="button" className="btn btn-link" onClick={this.groundInstructions} >{t('How to use background commands')}</button>
                </div>                
              </div>
              <div className="form-group">
                <label className="col-sm-3 control-label" htmlFor="aptNotes">Voice</label>
                <div className="col-sm-9">
                  <input type="text" className="form-control"
                    id="aptNotes"  ref={(ref) => this.inputAptNotes = ref } placeholder={t('Word you\'ll say to Alexa or Google (optional)')} onChange={this.handleVoiceChange} value={voicevalue} />
                </div>
              </div>
              <div className="form-group">
                <label className="col-sm-3 control-label" htmlFor="voiceReply">{t('Voice Reply')}</label>
                <div className="col-sm-9">
                  <input type="text" className="form-control"
                    id="voiceReply"  ref={(ref) => this.inputVoiceReply = ref } placeholder={t('In the conversational skills, Alexa will say this back (optional)')} onChange={this.handleVoiceReplyChange} value={voiceReplyvalue} />
                </div>
              </div>
              <div className="form-group">
                <label className="col-sm-3 control-label" htmlFor="allowParams">{t('Allow Parameters')}</label>
                <div className="col-sm-9">
                  <select id="mySelect" className="form-control" id="allowParams"  ref={(ref) => this.inputAllowParams = ref } onChange={this.handleAllowParamsChange} value={allowParamsvalue} >
                    <option>false</option>
                    <option>true</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <div className="col-sm-offset-3 col-sm-9">
                  <div className="pull-right">
                    <button type="button" className="btn btn-default"  onClick={this.toggleAptDisplay}>{t('Cancel')}</button>&nbsp;
                    <button type="submit" className="btn btn-primary">{t('Save')}</button>
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

// module.exports=EditAppointment;
module.exports = withTranslation()(EditAppointment);