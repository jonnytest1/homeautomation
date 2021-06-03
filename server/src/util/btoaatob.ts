export function btoa(str) {
    return Buffer.from(str)
        .toString('base64');
}

export function atob(str) {
    return Buffer.from(str, 'base64')
        .toString();
}