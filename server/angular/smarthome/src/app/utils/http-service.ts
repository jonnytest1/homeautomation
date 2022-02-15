import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface LogOptions {
    logText?: string;
    logParams?: {
        [key: string]: number | string
    };
}

interface HttpOptions extends LogOptions {
    headers?: HttpHeaders | {
        [header: string]: string | string[];
    };
    observe?: 'body';
    params?: HttpParams | {
        [param: string]: string | string[];
    };
    reportProgress?: boolean;
    responseType?: 'json';
    withCredentials?: boolean;
}
@Injectable()
export abstract class AbstractHttpService {
    constructor(private _http: HttpClient, private router: Router) { }
    /**
     * !!! may include differences for certain option parts
     * @see HttpClient implementation
     */
    get<T = any>(url: string, options?: HttpOptions): Observable<T> {
        return this._http.get<T>(url, options)
            .pipe(
                catchError(error => this.defaultErrorHandler(error, 'GET', options))
            );
    }
    /**
     * !!! may include differences for certain option parts
     * @see HttpClient
     */
    put<T = any>(url: string, body: any | null, options?: HttpOptions): Observable<T> {
        return this._http.put<T>(url, body, options)
            .pipe(
                catchError(error => this.defaultErrorHandler(error, 'PUT', options))
            );
    }
    /**
     * !!! may include differences for certain option parts
     * @see HttpClient implementation
     */
    post<T = any>(url: string, body: any | null, options?: HttpOptions): Observable<T> {
        return this._http.post<T>(url, body, options)
            .pipe(
                catchError(error => this.defaultErrorHandler(error, 'POST', options))
            );
    }
    /**
     * !!! may include differences for certain option parts
     * @see HttpClient implementation
     */
    delete<T = any>(url: string, options?: HttpOptions): Observable<T> {
        return this._http.delete<T>(url, options)
            .pipe(
                catchError(error => this.defaultErrorHandler(error, 'POST', options))
            );
    }

    defaultErrorHandler(error: HttpErrorResponse, method: 'GET' | 'POST' | 'PUT' | 'DELETE', options?: LogOptions) {
        /*const logObject: any = {
            message: error.message,
            status: error.status,
            url: error.url,
            method,
            headers: JSON.stringify(error.headers.keys()
                .map(key => ({ [key]: error.headers.getAll(key) })))
        };
        if (options && options.logText) {

            logObject.methodText = options.logText;
        }
        if (options && options.logParams) {
            Object.assign(logObject, options.logParams);
        }*/
        if (error.status === 0) {
            //debugger;
            //  location.reload();
            return EMPTY;
        }
        if (error.status === 401) {
            this.router.navigateByUrl('/login');
            return EMPTY;
        }
        throw error;
    }
}
