import "../styles/globals.css";
import type { ReactNode } from "react";


import ReduxProvider from "./ReduxProvider";
import { Toaster } from "@/components/ui/toaster";
import GlobalChatWidget from "@/components/GlobalChatWidget";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReduxProvider>
          {children}
          <Toaster />
          <GlobalChatWidget />
        </ReduxProvider>
        
      </body>
    </html>
  );
}
