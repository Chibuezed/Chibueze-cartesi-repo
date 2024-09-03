const { ethers } = require("ethers");

const rollup_server = process.env.ROLLUP_HTTP_SERVER_URL;

function hex2str(hex) {
  return ethers.toUtf8String(hex);
}

function str2hex(payload) {
  return ethers.hexlify(ethers.toUtf8Bytes(payload));
}

let userTasks = {};

async function handle_advance(data) {
  console.log("Received advance request data " + JSON.stringify(data));

  const metadata = data["metadata"];
  const sender = metadata["msg_sender"];
  const payload = hex2str(data["payload"]);

  try {
    const { action, task } = JSON.parse(payload);

    if (!userTasks[sender]) {
      userTasks[sender] = [];
    }

    let responseMessage = "";

    switch (action) {
      case "add":
        userTasks[sender].push({ task, completed: false });
        responseMessage = `Task "${task}" added successfully.`;
        break;
      case "complete":
        const taskIndex = userTasks[sender].findIndex(t => t.task === task);
        if (taskIndex !== -1) {
          userTasks[sender][taskIndex].completed = true;
          responseMessage = `Task "${task}" marked as complete.`;
        } else {
          responseMessage = `Task "${task}" not found.`;
        }
        break;
      default:
        throw new Error("Invalid action. Use 'add' or 'complete'.");
    }

    const notice_req = await fetch(rollup_server + "/notice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ payload: str2hex(responseMessage) }),
    });

    return "accept";
  } catch (error) {
    const report_req = await fetch(rollup_server + "/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ payload: str2hex(error.message) }),
    });

    return "reject";
  }
}

async function handle_inspect(data) {
  console.log("Received inspect request data " + JSON.stringify(data));

  const sender = data.metadata.msg_sender;
  const route = hex2str(data["payload"]);

  let responseObject;
  if (route === "list") {
    responseObject = JSON.stringify(userTasks[sender] || []);
  } else {
    responseObject = "Invalid inspect request. Use 'list' to see your tasks.";
  }

  const report_req = await fetch(rollup_server + "/report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ payload: str2hex(responseObject) }),
  });

  return "accept";
}

var handlers = {
  advance_state: handle_advance,
  inspect_state: handle_inspect,
};

var finish = { status: "accept" };

(async () => {
  while (true) {
    const finish_req = await fetch(rollup_server + "/finish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "accept" }),
    });

    console.log("Received finish status " + finish_req.status);

    if (finish_req.status == 202) {
      console.log("No pending rollup request, trying again");
    } else {
      const rollup_req = await finish_req.json();
      var handler = handlers[rollup_req["request_type"]];
      finish["status"] = await handler(rollup_req["data"]);
    }
  }
})();