var React = require('react');

var EMOJI_CATEGORIES = [
  {
    label: 'Media & Entertainment',
    emojis: ['📺','🎬','🎵','🎶','🎸','🎹','🎮','🕹️','📻','📡','🔊','🔔','🎙️','🎧','🎤','📽️','🎞️','📸']
  },
  {
    label: 'Home & Devices',
    emojis: ['💡','🔌','🖥️','💻','🖨️','⌨️','🖱️','📱','☎️','📞','🔋','🔦','🏠','🏡','🚪','🪟','🛋️','🪑','🛏️','🚿','🛁','🪞','🧹','🧺','🧻','🪣']
  },
  {
    label: 'Weather & Environment',
    emojis: ['☀️','🌤️','⛅','🌧️','⛈️','🌩️','❄️','🌬️','💨','🌡️','🔥','💧','🌊','🌿','🌱','🍃']
  },
  {
    label: 'Transport & Navigation',
    emojis: ['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','✈️','🚀','🛸','🚂','🚢','🏍️','🛵','🚲','🛴']
  },
  {
    label: 'Tools & Controls',
    emojis: ['🔧','🔩','⚙️','🛠️','🔑','🗝️','🔐','🔒','🔓','📂','📁','🗂️','📋','📌','📍','✅','❌','⚠️','ℹ️','▶️','⏸️','⏹️','⏺️','⏭️','⏮️','🔄','🔃']
  },
  {
    label: 'People & Gestures',
    emojis: ['👤','👥','🧑','👨','👩','🧒','👶','🧓','👍','👎','👋','🤝','🙌','👏','🤜','🤛','💪','🫶','❤️','🧠','👁️','👂','🦷','🦴']
  },
  {
    label: 'Food & Nature',
    emojis: ['🍎','🍊','🍋','🍇','🍓','🥑','🥦','🍕','🍔','🍜','☕','🍵','🧃','🥤','🌸','🌺','🌻','🌹','🌴','🌵','🍄','🐶','🐱','🐦','🐠','🐾']
  },
  {
    label: 'Symbols & Misc',
    emojis: ['⭐','🌟','✨','💫','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🔶','🔷','❓','❗','💬','💭','🔔','🚫','✏️','📝','🖊️','📊','📈','📉','🗓️','⏰','⌚','🕐']
  }
];

var PICKER_STYLE = {
  position: 'absolute',
  zIndex: 9999,
  background: '#fff',
  border: '1px solid #ccc',
  borderRadius: '6px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
  width: '320px',
  marginTop: '2px',
  display: 'flex',
  flexDirection: 'column'
};

var PICKER_GRID_STYLE = {
  overflowY: 'auto',
  maxHeight: '280px',
  padding: '8px 8px 0 8px'
};

var PICKER_FOOTER_STYLE = {
  borderTop: '1px solid #e8e8e8',
  padding: '6px 8px',
  background: '#fafafa',
  borderRadius: '0 0 6px 6px'
};

var CUSTOM_INPUT_ROW_STYLE = {
  display: 'flex',
  gap: '4px',
  alignItems: 'center'
};

var CUSTOM_INPUT_STYLE = {
  flex: 1,
  fontSize: '13px',
  padding: '3px 6px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  outline: 'none'
};

var CUSTOM_APPLY_STYLE = {
  fontSize: '12px',
  padding: '3px 8px',
  border: '1px solid #aaa',
  borderRadius: '4px',
  background: '#fff',
  cursor: 'pointer',
  whiteSpace: 'nowrap'
};

var CATEGORY_LABEL_STYLE = {
  fontSize: '10px',
  fontWeight: 'bold',
  color: '#888',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  margin: '6px 0 2px',
  display: 'block'
};

var EMOJI_BUTTON_STYLE = {
  background: 'none',
  border: 'none',
  fontSize: '20px',
  cursor: 'pointer',
  padding: '3px 4px',
  borderRadius: '4px',
  lineHeight: 1
};

var TRIGGER_BUTTON_STYLE = {
  fontSize: '20px',
  padding: '2px 8px',
  lineHeight: '1.4',
  borderRadius: '4px',
  border: '1px solid #ccc',
  background: '#fff',
  cursor: 'pointer',
  minWidth: '44px'
};

var CLEAR_BUTTON_STYLE = {
  fontSize: '11px',
  color: '#999',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '0 0 4px 0',
  textDecoration: 'underline'
};

class EmojiPicker extends React.Component {
  constructor(props) {
    super(props);
    this.state = { open: false, customInput: '', customError: false };
    this.toggleOpen = this.toggleOpen.bind(this);
    this.handleSelect = this.handleSelect.bind(this);
    this.handleClear = this.handleClear.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.handleCustomInputChange = this.handleCustomInputChange.bind(this);
    this.handleCustomApply = this.handleCustomApply.bind(this);
    this.handleCustomKeyDown = this.handleCustomKeyDown.bind(this);
    this.containerRef = React.createRef();
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  handleClickOutside(e) {
    if (this.containerRef.current && !this.containerRef.current.contains(e.target)) {
      this.setState({ open: false });
    }
  }

  toggleOpen(e) {
    e.preventDefault();
    this.setState(function(s) { return { open: !s.open }; });
  }

  handleSelect(emoji) {
    this.props.onSelect(emoji);
    this.setState({ open: false });
  }

  handleClear(e) {
    e.preventDefault();
    this.props.onSelect('');
  }

  handleCustomInputChange(e) {
    this.setState({ customInput: e.target.value, customError: false });
  }

  handleCustomKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.handleCustomApply();
    }
  }

  resolveCustomInput(text) {
    text = text.trim();
    if (!text) return null;
    // Match one or more U+XXXX / U+XXXXX / U+XXXXXX codepoints (e.g. "U+1F9D0" or "U+1F1FA U+1F1F8")
    if (/^(U\+[0-9A-Fa-f]{1,6}\s*)+$/i.test(text)) {
      try {
        var codePoints = [];
        var re = /U\+([0-9A-Fa-f]{1,6})/gi;
        var m;
        while ((m = re.exec(text)) !== null) {
          codePoints.push(parseInt(m[1], 16));
        }
        return String.fromCodePoint.apply(String, codePoints);
      } catch (err) {
        return null;
      }
    }
    // Otherwise treat as a literal pasted emoji/character
    return text;
  }

  handleCustomApply() {
    var resolved = this.resolveCustomInput(this.state.customInput);
    if (resolved) {
      this.props.onSelect(resolved);
      this.setState({ open: false, customInput: '', customError: false });
    } else {
      this.setState({ customError: true });
    }
  }

  render() {
    var value = this.props.value || '';
    var open = this.state.open;
    var customInput = this.state.customInput;
    var customError = this.state.customError;

    return (
      <div ref={this.containerRef} style={{ position: 'relative', display: 'inline-block' }}>
        <button
          type="button"
          style={TRIGGER_BUTTON_STYLE}
          onClick={this.toggleOpen}
          title={value ? ('Icon: ' + value + ' — click to change') : 'Click to pick an emoji icon'}
        >
          {value || '＋'}
        </button>
        {value ? (
          <button type="button" style={CLEAR_BUTTON_STYLE} onClick={this.handleClear}>
            &nbsp;clear
          </button>
        ) : null}
        {open ? (
          <div style={PICKER_STYLE}>
            <div style={PICKER_GRID_STYLE}>
              {EMOJI_CATEGORIES.map(function(cat) {
                return (
                  <div key={cat.label}>
                    <span style={CATEGORY_LABEL_STYLE}>{cat.label}</span>
                    <div>
                      {cat.emojis.map(function(emoji) {
                        return (
                          <button
                            key={emoji}
                            type="button"
                            style={EMOJI_BUTTON_STYLE}
                            title={emoji}
                            onClick={function() { this.handleSelect(emoji); }.bind(this)}
                            onMouseEnter={function(e) { e.currentTarget.style.background = '#f0f0f0'; }}
                            onMouseLeave={function(e) { e.currentTarget.style.background = 'none'; }}
                          >
                            {emoji}
                          </button>
                        );
                      }.bind(this))}
                    </div>
                  </div>
                );
              }.bind(this))}
            </div>
            <div style={PICKER_FOOTER_STYLE}>
              <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>
                Or paste an emoji / enter a code like <strong>U+1F9D0</strong>:
              </div>
              <div style={CUSTOM_INPUT_ROW_STYLE}>
                <input
                  type="text"
                  style={Object.assign({}, CUSTOM_INPUT_STYLE, customError ? { borderColor: '#c0392b' } : {})}
                  value={customInput}
                  onChange={this.handleCustomInputChange}
                  onKeyDown={this.handleCustomKeyDown}
                  placeholder="e.g. 🧑‍💻 or U+1F9D0"
                />
                <button type="button" style={CUSTOM_APPLY_STYLE} onClick={this.handleCustomApply}>
                  Use
                </button>
              </div>
              {customError ? (
                <div style={{ fontSize: '11px', color: '#c0392b', marginTop: '3px' }}>
                  Could not parse — paste an emoji or use format U+1F600
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    );
  }
}

module.exports = EmojiPicker;
