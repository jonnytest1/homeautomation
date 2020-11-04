
const time = 60 * 12;
({
    response: {
        time
    },
    promise: delay(time, {
        notification: {
            title: "Nudeln !!!!"
        }
    })
}) 