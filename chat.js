const api_key = "pjVN997xEz82304l9HmceblDsr3neV95Mku6pS0C";
const api_key2 = "e3612098484d98c628b4bcb0f52cd1ab3fa1c05b72cbe93e51d42f91";

Math.seedrandom(window.location.pathname);
const channel = Math.random().toString().replace("0", "").slice(1, 5);
console.log(channel);
Math.seedrandom();

const url = `wss://us-nyc-1.websocket.me/v3/${channel}?api_key=${api_key}&notify_self`;
class App extends React.Component {
  constructor() {
    super();
    this.state = {
      isLogged: false,
      isCollapsed: false,
      name: "",
      ip: "",
      id: "",
      ws: new WebSocket(url),
      messages: [],
      users: [],
    };
  }

  componentDidMount() {
    window.addEventListener("beforeunload", this.keepOnPage);
    const { ws } = this.state;
    this.handleId();
    this.getip();
    ws.onopen = () => {
      console.log("Connected to Chat");
    };
    ws.onmessage = (evt) => {
      const message = JSON.parse(evt.data);
      if (message.message === "") return;
      if (message.id === "service") {
        if (message.type === "online") {
          this.setState({ users: message.users });
        }
      }
      this.setState((state) => ({ messages: [...state.messages, message] }));
    };
    ws.onclose = () => {
      console.log("disconnected");
      this.setState({ ws: new WebSocket(url) });
    };
  }

  keepOnPage = (ev) => {
    if (this.state.name) {
      this.submitMessage("left the chat");
    }
  };

  // Get IP
  async getip() {
    let ip = "";
    try {
      const response = await fetch(`https://api.ipdata.co?api-key=${api_key2}`);
      const data = await response.json();
      ip = data.ip;
    } catch (err) {
      console.log(err);
    }
    this.setState({ ip: ip });
  }

  // ID Handler
  handleId() {
    const id = localStorage.getItem("dcl_chat_id");
    if (localStorage.getItem("dcl_chat_id")) {
      this.setState({ id: id });
    } else {
      const new_id = Math.random().toString(16).substring(2);
      this.setState({ id: new_id });
      localStorage.setItem("dcl_chat_id", new_id);
    }
  }

  // Send Handler
  submitMessage(message) {
    const { name, id, ws, ip } = this.state;
    ws.send(JSON.stringify({ name, id, ip, message, date: new Date() }));
  }

  // Handle Name Input
  handleName(key) {
    if (
      key.length === 1 &&
      key.match(/^[0-9a-zA-Z]+$/) &&
      this.state.name.length < 15
    ) {
      this.setState((state) => ({ name: state.name + key }));
    } else if (key === "Backspace") {
      this.setState((state) => ({ name: state.name.slice(0, -1) }));
    } else if (key === "Enter" && this.state.name.length) {
      this.setState({ isLogged: true });
      this.submitMessage("joined the chat");
    }
  }

  render() {
    const { users, isLogged, messages, id, isCollapsed } = this.state;
    if (isLogged) {
      return isCollapsed ? (
        <div
          className="expand-icon"
          onClick={() => this.setState({ isCollapsed: false })}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="40"
            height="40"
          >
            <path fill="none" d="M0 0h24v24H0z" />
            <path d="M14.45 19L12 22.5 9.55 19H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-6.55zm-1.041-2H20V5H4v12h6.591L12 19.012 13.409 17z" />
          </svg>
        </div>
      ) : (
        <div className={isCollapsed ? "chat-collapsed" : "chat-expanded"}>
          <div
            onClick={() => this.setState({ isCollapsed: true })}
            className="collapse-icon"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
            >
              <path fill="none" d="M0 0h24v24H0z" />
              <path d="M12.36 13.05L17.31 18H5.998V6.688l4.95 4.95 5.656-5.657 1.415 1.414z" />
            </svg>
          </div>
          <OnLine users={users} />
          <Chat messages={messages} id={id} />
          <Input submitMessage={this.submitMessage.bind(this)} />
        </div>
      );
    } else {
      return (
        <input
          autoFocus
          className="name-input"
          placeholder="Enter your name to start chatting!"
          onKeyDown={(e) => this.handleName(e.key)}
          value={this.state.name}
          spellCheck="false"
          readOnly={true}
        />
      );
    }
  }
}

const Chat = ({ messages, id }) => {
  const scroll = React.createRef(null);

  React.useEffect(() => {
    scroll.current.addEventListener("DOMNodeInserted", (event) => {
      const { currentTarget: target } = event;
      target.scroll({ top: target.scrollHeight, behavior: "smooth" });
    });
  }, []);

  return (
    <div className="messages" ref={scroll}>
      {messages.map((data, index) => (
        <Message data={data} id={id} key={index} />
      ))}
    </div>
  );
};

class Input extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      value: "",
    };
    this.inputField = React.createRef();
  }

  componentDidMount() {
    window.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.inputField.current.focus();
        this.setState({ value: "" });
      }
    });
  }

  handleSend = (e) => {
    const { value } = this.state;
    if (e.code === "Enter" && value !== "\n" && value !== "") {
      this.props.submitMessage(value);
      this.setState({ value: "" });
    } else if (value === "\n") {
      this.setState({ value: "" });
    }
  };

  render() {
    return (
      <textarea
        ref={this.inputField}
        className="input"
        rows="4"
        cols="40"
        placeholder="Type your message and hit ↵..."
        value={this.state.value}
        onChange={(e) => this.setState({ value: e.target.value })}
        onKeyPress={(e) => this.handleSend(e)}
      />
    );
  }
}

class Message extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  render() {
    const { data, id } = this.props;
    const style = data.id === id ? "message user" : "message";
    if (data.id === "service") {
      return (
        <div>
          <b>{data.name + " "}</b>
          {data.message}
        </div>
      );
    }
    if (data.message === "joined the chat" || data.message === "left the chat")
      return null;
    return (
      <div className={style}>
        <b>{data.name + ": "}</b>
        {data.message}
      </div>
    );
  }
}

class OnLine extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      expanded: false,
    };
  }

  render() {
    const { users } = this.props;
    const { expanded } = this.state;
    const userslist = expanded ? "userslist-expanded" : "userslist-collapsed";
    return (
      <React.Fragment>
        <div className="online-users">
          {users.length}
          <div
            onClick={() => this.setState({ expanded: !expanded })}
            className="users"
          >
            users
          </div>
          online
        </div>
        <div className={userslist}>
          {users.map((user, index) => (
            <div className="online-user" key={index}>
              {user}
            </div>
          ))}
        </div>
      </React.Fragment>
    );
  }
}

ReactDOM.render(<App />, document.querySelector("#chat"));
