import { Client, Account, ID, Databases, Query } from "appwrite";
import { useEffect, useState } from "react";
export default function App() {
  const [show, setShow] = useState({
    phone: true,
    otp: false,
    room: false,
    chat: false,
  });
  const [value, setValue] = useState({
    phone: "",
    otp: "",
    create: "",
    join: "",
    chat: "",
    user: {},
    chats: [],
  });
  const [room, setRoom] = useState(null);
  const client = new Client();
  client
    .setEndpoint("https://cloud.appwrite.io/v1")
    .setProject("64a12429836b3301e250");

  const account = new Account(client);
  const databases = new Databases(client);

  const getOtp = () => {
    const promise = account.createPhoneSession(
      ID.unique(),
      "+91" + value.phone
    );
    promise.then(
      function (response) {
        setShow({ ...show, otp: true });
        setValue({ ...value, userId: response.userId });
      },
      function (error) {
        alert(error);
      }
    );
  };

  const validateOtp = () => {
    const promise = account.updatePhoneSession(value.userId, value.otp);

    promise.then(
      function (response) {
        setShow({ ...show, otp: false, phone: false, room: true });
        setValue({
          ...value,
          otp: "",
          phone: "",
          user: { phone: response.phone },
        });
      },
      function (error) {
        alert(error);
      }
    );
  };

  const logout = () => {
    const promise = account.deleteSession("current");
    promise
      .then((response) => {
        setShow({
          phone: true,
          otp: false,
          room: false,
          chat: false,
        });
        setValue({
          phone: "",
          otp: "",
          create: "",
          join: "",
          chat: "",
          userId: null,
          user: {},
          chats: [],
        });
      })
      .catch((err) => {
        alert(err);
      });
  };

  const createRoom = () => {
    const promise = databases.createDocument(
      "64a13ac145320fdd48eb",
      "64a13b4157e4c5e8d166",
      value.create,
      {
        name: value.create,
      }
    );

    promise.then(
      function (response) {
        setShow({ ...show, room: false, chat: true });
        setValue({ ...value, chats: response.chats, room: "" });
        setRoom(response.name);
      },
      function (error) {
        alert(error);
        setValue({ ...value, create: "" });
      }
    );
  };

  const joinRoom = () => {
    const promise = databases.getDocument(
      "64a13ac145320fdd48eb",
      "64a13b4157e4c5e8d166",
      value.join
    );
    promise
      .then((response) => {
        setShow({ ...show, chat: true, room: false });
        setValue({ ...value, chats: response.chats, join: "" });
        setRoom(response.name);
      })
      .catch((err) => {
        alert(err);
        setValue({ ...value, join: "" });
      });
  };

  const leaveRoom = () => {
    setValue({ ...value, chats: [] });
    setShow({ ...show, chat: false, create: true, room: true });
    setRoom(null);
  };

  const addMessage = () => {
    const promise = databases.updateDocument(
      "64a13ac145320fdd48eb",
      "64a13b4157e4c5e8d166",
      room,
      {
        chats: [...value.chats, value.user.phone + value.chat],
      }
    );
    promise
      .then((response) => {
        setValue({
          ...value,
          chat: "",
        });
      })
      .catch((err) => alert(err));
  };

  useEffect(() => {
    if (!room) return;
    console.log("triggered");
    const unsubscribe = client.subscribe(["documents"], (data) => {
      if (
        data.events.filter(
          (event) =>
            event ===
            "databases.64a13ac145320fdd48eb.collections.64a13b4157e4c5e8d166.documents." +
              room +
              ".update"
        ).length
      ) {
        setValue({ ...value, chats: data.payload.chats });
      }
    });
    return () => {
      unsubscribe();
    };
  }, [room]);

  useEffect(() => {
    const promise = account.get();
    promise.then((response) => {
      setShow({ ...show, phone: false, room: true, chat: false });
      setValue({
        ...value,
        user: {
          phone: response.phone,
          id: response.$id
        },
      });
    });
  }, []);

  return (
    <div className="flex flex-col gap-2 p-4 max-w-lg mx-auto bg-base-200 h-screen overflow-hidden relative">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl">Chat</h1>
        <div className="space-x-2">
          {show.chat && (
            <button className="btn btn-error" onClick={leaveRoom}>
              Leave Room
            </button>
          )}
          {value.user.phone && (
            <button className="btn btn-error" onClick={logout}>
              Log Out
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto mb-12 py-4 flex flex-col gap-2">
        <ButtonInput
          mode={"Send OTP"}
          placeholder="Enter phone number"
          btnType="success"
          type="number"
          show={show.phone}
          value={value.phone}
          onChange={(e) => setValue({ ...value, phone: e.target.value })}
          onClick={getOtp}
        />
        <ButtonInput
          mode={"Validate OTP"}
          placeholder="Enter OTP"
          btnType="success"
          type="number"
          show={show.otp}
          value={value.otp}
          onChange={(e) => setValue({ ...value, otp: e.target.value })}
          onClick={validateOtp}
        />
        <ButtonInput
          mode={"Create Room"}
          placeholder="Enter a room name"
          btnType="primary"
          show={show.room}
          value={value.create}
          onChange={(e) => setValue({ ...value, create: e.target.value })}
          onClick={createRoom}
        />
        <ButtonInput
          mode={"Join Room"}
          placeholder="Enter a room name"
          btnType="primary"
          show={show.room}
          value={value.join}
          onChange={(e) => setValue({ ...value, join: e.target.value })}
          onClick={joinRoom}
        />
        <div className="mb-auto text-xl mx-auto">{show.chat && room}</div>
        <div className="flex flex-col gap-2">
          {value.chats.map((chat) => {
            return (
              <div
                className={`chat ${
                  chat.slice(0, 13) === value.user.phone
                    ? "chat-end"
                    : "chat-start"
                }`}
              >
                <div className="chat-header">{chat.slice(0, 13)}</div>
                <div className="chat-bubble">{chat.slice(13)}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="absolute left-4 right-4 bottom-4">
        <ButtonInput
          mode={"Send"}
          btnType="error"
          placeholder="Start Chatting..."
          show={show.chat}
          value={value.chat}
          onChange={(e) => setValue({ ...value, chat: e.target.value })}
          onClick={addMessage}
        />
      </div>
    </div>
  );
}

const ButtonInput = ({ show, mode, btnType, onClick, ...props }) =>
  show ? (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="border mx-auto rounded-lg overflow-hidden w-full flex"
    >
      <input required className="input input-bordered flex-1" {...props} />
      <button className={`btn btn-${btnType} rounded-none w-36 normal-case`}>
        {mode}
      </button>
    </form>
  ) : (
    <></>
  );
