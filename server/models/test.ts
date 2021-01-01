const time = 60 * 10;
({
    response: {
        time,
        test: true
    },
    promise: delay(time, {
        notification: {
            body: "PreHeated"
        }
    })
});
