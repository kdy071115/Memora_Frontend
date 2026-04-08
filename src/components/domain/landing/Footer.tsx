import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-muted border-t border-border/50 py-12 pb-24 md:pb-12 text-sm text-muted-foreground">
      <div className="container mx-auto px-4 max-w-screen-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden relative border border-border">
             <Image src="/images/logo.png" alt="Memora Logo" fill sizes="32px" className="object-cover" />
          </div>
          <span className="font-bold text-xl text-foreground tracking-tight">Memora</span>
        </div>
        
        <div className="flex items-center space-x-6">
          <Link href="#" className="hover:text-primary transition-colors">서비스 소개</Link>
          <Link href="#" className="hover:text-primary transition-colors">이용약관</Link>
          <Link href="#" className="hover:text-primary transition-colors">개인정보처리방침</Link>
        </div>

        <div className="text-center md:text-right">
          <p>© 2026 Antigravity x Claude Code. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
