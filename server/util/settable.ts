
interface Setter {
    key: string;
    validation?(value: any): Promise<string>;
}

export function settableValidator(validationFunction) {
    return (target: any, propertyKey: string) => {
        const objR = target as { __setters?: Array<Setter> };
        if (!objR.__setters) {
            objR.__setters = [];
        }
        objR.__setters.push({ key: propertyKey, validation: validationFunction });
    };
}

export function settable(target: any, propertyKey: string) {
    const objR = target as { __setters?: Array<Setter> };
    if (!objR.__setters) {
        objR.__setters = [];
    }
    objR.__setters.push({ key: propertyKey });
}

export function assign(obj: any, data) {
    const objR = obj as { __setters?: Array<Setter> };
    const errorCollector = {};
    if (objR.__setters) {
        for (let key of objR.__setters) {
            if (key.key in data) {
                if (key.validation) {
                    const errorObj = key.validation.bind(objR)(data[key.key]);
                    if (errorObj) {
                        errorCollector[key.key] = errorObj;
                    } else {
                        objR[key.key] = data[key.key];
                    }
                } else {
                    objR[key.key] = data[key.key];
                }
            }
        }
    }

    if (Object.keys(errorCollector).length) {
        return errorCollector;
    }
    return null;
}