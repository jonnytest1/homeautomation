import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { ErrorHandler, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';


function base64ify(value: string) {
    try {
        btoa(value);
        return value;
    } catch (e) {
        return value.replace(/./g, c => {
            if (c.charCodeAt(0) > 256) {
                return '_';
            }
            return c;
        });
    }
}

export async function logKibana(level: 'INFO' | 'ERROR' | 'DEBUG', message, error?) {
    let logStack;
    try {
        throw new Error('origin');
    } catch (e) {
        logStack = base64ify(e.stack);
    }

    const devMode = location.host === 'localhost:4200';
    let jsonData: { [key: string]: string } = {
        Severity: level,
        application: `SmartHomeFe${devMode ? '_debug' : ''}`,
        log_stack: logStack
    };
    if (!message && error) {
        jsonData.message = base64ify(error.message);
    } else if (message instanceof Object) {
        if (message['message']) {
            jsonData.message = base64ify(message['message']);
            delete message['message'];
            for (const i in message) {
                if (typeof message[i] !== 'number' && typeof message[i] !== 'string') {
                    jsonData[i] = base64ify(JSON.stringify(message[i]));
                } else {
                    jsonData[i] = base64ify(message[i]);
                }
            }
        } else {
            jsonData.message = base64ify(JSON.stringify(message));
        }
    } else {
        jsonData.message = base64ify(message);
    }
    if (error) {
        const displayMessage = jsonData.message;
        jsonData = { ...jsonData, ...error };
        jsonData.error_message = base64ify(error.message);
        jsonData.error_stacktrace = base64ify(error.stack);

        if (displayMessage && error.message) {
            jsonData.message = base64ify(displayMessage);
        }

    }
    console.log(jsonData);
    if (devMode) {
        return;
    }
    fetch(`https://pi4.e6azumuvyiabvs9s.myfritz.net/tm/libs/log/index.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain'
        },
        body: btoa(JSON.stringify(jsonData))
    });
}
@Injectable({
    providedIn: 'root'
})
export class CustomErrorHandler implements HttpInterceptor {
    intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        // do request error handling
        return next.handle(req).pipe(
            catchError((error: HttpErrorResponse) => {
                logKibana('ERROR', 'request error', error);

                throw error;
            })
        );
    }

}
@Injectable()
export class CustomGlobalErrorHandler implements ErrorHandler {

    handleError(error: Error): void {
        logKibana('ERROR', 'global error', error);
        console.error(error);
    }

}
