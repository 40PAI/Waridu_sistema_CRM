"use client";

import * as React from "react";
import { useState } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { PasswordRecoveryForm } from "@/components/auth/PasswordRecoveryForm";

const LoginPage = () => {
  const [showRecovery, setShowRecovery] = React.useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      {!showRecovery ? (
        <LoginForm onForgotPasswordClick={() => setShowRecovery(true)} />
      ) : (
        <PasswordRecoveryForm onBackToLogin={() => setShowRecovery(false)} />
      )}
    </div>
  );
};

export default LoginPage;