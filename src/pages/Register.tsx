"use client";

import * as React from "react";
import { useNavigate } from "react-router-dom";
import { RegisterForm } from "@/components/auth/RegisterForm";

const RegisterPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <RegisterForm onBackToLogin={() => navigate("/login")} />
    </div>
  );
};

export default RegisterPage;
