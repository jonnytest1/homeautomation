export class ResolvablePromise<T, E = any> extends Promise<T>{

    public resolve: (value: T | PromiseLike<T>) => void;
    public reject: (reason?: E) => void;

    constructor(callback?: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: E) => void) => void) {
        let _res: (value: T | PromiseLike<T>) => void = () => { };
        let _rej: (reason?: E) => void = () => { };
        super((res, rej) => {
            _res = res;
            _rej = rej;
            if (callback) {
                callback(res, rej);
            }
        });
        this.resolve = _res;
        this.reject = _rej;
    }

    static delayed(millis: number) {
        return new ResolvablePromise((r) => setTimeout(r, millis));
    }
}