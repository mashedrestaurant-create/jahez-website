"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function NotFound() {
  const [isArabic, setIsArabic] = useState(true);

  useEffect(() => {
    setIsArabic(document.documentElement.lang !== "en");
  }, []);

  return (
    <main className="not-found-page">
      <Image src="/assets/jahez/logo.jpg" alt="چاهِز" width={150} height={150} />
      <h1>{isArabic ? "الصفحة دي مش موجودة" : "Page not found"}</h1>
      <p>{isArabic ? "ارجعي للرئيسية أو شوفي المنيو." : "Go back home or browse the menu."}</p>
      <div>
        <Link className="button button-dark" href="/">
          {isArabic ? "الرئيسية" : "Home"}
        </Link>
        <Link className="button button-primary" href="/menu">
          {isArabic ? "المنيو" : "Menu"}
        </Link>
      </div>
    </main>
  );
}
