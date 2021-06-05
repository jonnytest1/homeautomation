import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { ErrorHandler, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';


export async function logKibana(level: 'INFO' | 'ERROR' | 'DEBUG', message, error?) {
    let logStack;
    try {
        throw new Error('origin');
    } catch (e) {
        logStack = e.stack;
    }

    let jsonData: { [key: string]: string } = {
        Severity: level,
        application: `SmartHomeFe${location.host === 'localhost:4200' ? '_debug' : ''}`,
        log_stack: logStack
    };
    if (!message && error) {
        jsonData.message = error.message;
    } else if (message instanceof Object) {
        if (message['message']) {
            jsonData.message = message['message'];
            delete message['message'];
            for (const i in message) {
                if (typeof message[i] !== 'number' && typeof message[i] !== 'string') {
                    jsonData[i] = JSON.stringify(message[i]);
                } else {
                    jsonData[i] = message[i];
                }
            }
        } else {
            jsonData.message = JSON.stringify(message);
        }
    } else {
        jsonData.message = message;
    }
    if (error) {
        const displayMessage = jsonData.message;
        jsonData = { ...jsonData, ...error };
        jsonData.error_message = error.message;
        jsonData.error_stacktrace = error.stack;

        if (displayMessage && error.message) {
            jsonData.message = displayMessage;
        }

    }
    console.log(jsonData);
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
    }

}
