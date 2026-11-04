"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <main className="login">
      <form action={action}>
        <div>
          <h1>Admin</h1>
          <p>Sign in to edit the portfolio.</p>
        </div>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            autoFocus
            aria-describedby={state.error ? "login-error" : undefined}
          />
        </label>
        {state.error && (
          <p id="login-error" role="alert" className="form-error">
            {state.error}
          </p>
        )}
        <button className="btn" data-variant="solid" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
