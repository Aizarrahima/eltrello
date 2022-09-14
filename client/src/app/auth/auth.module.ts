import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { RegisterComponent } from "./components/register/register.component";
import { AuthService } from "./services/auth.service";
import { ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { LoginComponent } from "./components/login/login.component";
import { AuthGuardService } from "./services/authGuard.service";

const routes: Routes = [
  {
    path: "register",
    component: RegisterComponent,
  },
  {
    path: "login",
    component: LoginComponent,
    canActivate: [AuthGuardService]
  },
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    CommonModule
  ],
  providers: [
    AuthService,
    AuthGuardService,
  ],
  declarations: [RegisterComponent, LoginComponent]
})

export class AuthModule { }
