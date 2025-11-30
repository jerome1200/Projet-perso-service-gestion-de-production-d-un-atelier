"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/auth"); // redirection fluide sans écran noir
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white text-lg">
      Redirection vers la page d’authentification...
    </div>
  );
}
