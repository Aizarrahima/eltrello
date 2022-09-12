import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { CurrentUserInterface } from "../types/currentUser.interface";
import {HttpClient} from "@angular/common/http";
import { environment } from "src/environments/environment";

@Injectable()
export class AuthService {
  //Observable => a representation of the stream (something which is changed over time). Get new value and inside
  currentUser$ = new BehaviorSubject<CurrentUserInterface | null | undefined>(
    undefined
  );

  constructor(private http: HttpClient) {

  }

  getCurrentUser(): Observable<CurrentUserInterface> {
    const url = environment.apiUrl + "http://localhost:4001/api/user";
    return this.http.get<CurrentUserInterface>(url);
  }

  setCurrentUser(currentUser: CurrentUserInterface):void {
    this.currentUser$.next(currentUser);
  }
}
