module.exports = (context, basicIO) => {

    const action = basicIO.getArgument("action");

    let response;

    if (action === "register") {
        const name = basicIO.getArgument("name");
        const email = basicIO.getArgument("email");

        if (!name || !email) {
            response = { status: "error", message: "Missing data" };
        } else {
            // later we will save in DB
            response = {
                status: "success",
                message: "User registered successfully",
                data: { name, email }
            };
        }
    }

    else if (action === "login") {
        const email = basicIO.getArgument("email");

        response = {
            status: "success",
            message: `Login successful for ${email}`
        };
    }

    else {
        response = {
            status: "error",
            message: "Invalid action"
        };
    }

    basicIO.write(JSON.stringify(response));
    context.close();
};