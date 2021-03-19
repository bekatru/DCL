const api_key = "pjVN997xEz82304l9HmceblDsr3neV95Mku6pS0C";
const api_key_beka = "PjbrX0griIUkeRd3y8Rza0dZPBqlilvd39Ncrw7O";
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
            dcl_names: [],
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
            const data = JSON.parse(evt.data);
            const { type, message, id, onlineUsers, name, messages, adress } = data;
            console.log({ onmessage: data }); //Console
            if (id === "service") {
                switch (type) {
                    case "connection":
                        this.setState({ users: onlineUsers });
                        if (messages && adress === this.state.id) {
                            this.setState({
                                messages: [...this.state.messages, ...messages],
                            });
                        }
                        break;
                    default:
                        console.log(data);
                }
            } else {
                this.setState({
                    messages: [...this.state.messages, { type, id, name, message }],
                });
            }
        };
        ws.onclose = () => {
            console.log("disconnected");
            this.setState({ ws: new WebSocket(url) });
        };
    }

    keepOnPage = (ev) => {
        if (this.state.name) {
            this.submitMessage("left", "connection");
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
        const new_id = Math.random().toString(16).substring(2, 8).toUpperCase();
        this.setState({ id: new_id });
    }

    // Send Handler
    submitMessage(message, type = "default") {
        if (message === "") return; //Prevent from sending an empty message
        const { name, id, ws, ip } = this.state;
        ws.send(JSON.stringify({ type, name, id, ip, message, date: new Date() }));
    }

    // Handle Name Input
    handleName = async (e) => {
        const name = e.target.value;
        await this.setState({ name: name, isLogged: true });
        this.submitMessage('joined', 'connection');
    }

    mmEnable = () => {
        if (!window.ethereum) {
            if (confirm('Please install MetaMask 🦊')) {
                window.open('https://metamask.io/');
            }
            return;
        }
        window.ethereum
            .request({ method: "eth_requestAccounts" })
            .then((accounts) => accounts[0])
            .then(address => {
                const url = `https://api.opensea.io/api/v1/assets?owner=${address}&order_direction=desc&offset=0&limit=20&collection=dcl-names`;
                fetch(url)
                    .then(response => response.json())
                    .then(data => {
                        const names = data.assets
                            .filter(item => item.collection.slug === 'dcl-names')
                            .map(asset => asset.name);
                        if (names.length) {
                            this.setState({ dcl_names: names });
                        } else {
                            alert('You don\'t have any name assets');
                        }
                    })
                    .catch(err => console.error(err));
            })
            .catch((error) => console.log(error));
    }

    render() {
        const { users, isLogged, messages, id, isCollapsed } = this.state;
        if (isLogged) {
            return isCollapsed ? (
                <div
                    className="expand-icon"
                    onClick={() => this.setState({ isCollapsed: false })}
                >
                    <img src="./assets/bubble.svg" alt="chat" />
                </div>
            ) : (
                <div className={isCollapsed ? "chat-collapsed" : "chat-expanded"}>
                    <div
                        onClick={() => this.setState({ isCollapsed: true })}
                        className="collapse-icon"
                    >
                        <img src="./assets/close.svg" alt="collapse" />
                    </div>
                    <OnlineUsers users={users} />
                    <Chat messages={messages} id={id} />
                    <Input submitMessage={this.submitMessage.bind(this)} />
                </div>
            );
        } else {
            return (
                <div>
                    {
                        !this.state.dcl_names.length
                            ? (
                                <div
                                    className="expand-icon"
                                    onClick={this.mmEnable}
                                >
                                    <img src="./assets/bubble.svg" alt="chat" />
                                </div>
                            )
                            : (
                                <div>
                                    <select className='dropdown' onChange={this.handleName}>
                                        <option className='label'>Choose your name to start chatting!</option>
                                        {
                                            this.state.dcl_names.map(name => <option className='options' key={name} value={name}>{name}</option>)
                                        }
                                    </select>
                                </div>
                            )
                    }
                </div>
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
        if (this.inputField) {
            window.addEventListener("keypress", (e) => {
                if (e.key === "Enter") {
                    this.inputField.current.focus();
                    this.setState({ value: "" });
                }
            });
        }
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
        if (data.type === "connection") {
            return (
                <div>
                    <b>{data.name + " "}</b>
                    {data.message + " the chat"}
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

class OnlineUsers extends React.PureComponent {
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
                    {users.map(({ name }, index) => (
                        <div className="online-user" key={index}>
                            {name}
                        </div>
                    ))}
                </div>
            </React.Fragment>
        );
    }
}

ReactDOM.render(<App />, document.querySelector("#chat"));
