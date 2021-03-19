export class OnlineUsers extends React.PureComponent {
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

exports.OnlineUsers = OnlineUsers;
