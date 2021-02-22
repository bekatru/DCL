const api_key = "pjVN997xEz82304l9HmceblDsr3neV95Mku6pS0C";
const api_key2 = "e3612098484d98c628b4bcb0f52cd1ab3fa1c05b72cbe93e51d42f91";

Math.seedrandom(window.location.pathname);
const channel = Math.random().toString().replace("0", "").slice(1, 5);
console.log(channel);
// Math.seedrandom();

const url = `wss://us-nyc-1.websocket.me/v3/${channel}?api_key=${api_key}&notify_self`;
class App extends React.Component {
  constructor() {
    super();
    this.state = {
      isLogged: false,
      name: "",
      ip: "",
      id: "",
      ws: new WebSocket(url),
      messages: [],
    };
  }

  componentDidMount() {
    const { ws } = this.state;

    this.handleId();

    this.getip();

    ws.onopen = () => {
      console.log("Connected to Chat");
    };

    ws.onmessage = (evt) => {
      const message = JSON.parse(evt.data);
      this.setState((state) => ({ messages: [...state.messages, message] }));
    };

    ws.onclose = () => {
      console.log("disconnected");
      this.setState({ ws: new WebSocket(url) });
    };
  }

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
    }
  }

  render() {
    if (this.state.isLogged) {
      return (
        <React.Fragment>
          <Chat messages={this.state.messages} id={this.state.id} />
          <Input submitMessage={this.submitMessage.bind(this)} />
        </React.Fragment>
      );
    } else {
      return (
        <input
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
  }

  handleSend = (e) => {
    if (e.code === "Enter" && this.state.value !== "\n") {
      this.props.submitMessage(this.state.value);
      this.setState({ value: "" });
    } else if (this.state.value === "\n") {
      this.setState({ value: "" });
    }
  };

  render() {
    return (
      <textarea
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
    return (
      <div className={style}>
        <b>{data.name + ": "}</b>
        {data.message}
      </div>
    );
  }
}

ReactDOM.render(<App />, document.querySelector("#chat"));
