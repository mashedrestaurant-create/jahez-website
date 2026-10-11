"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [isArabic, setIsArabic] = useState(true);

  useEffect(() => {
    setIsArabic(document.documentElement.lang !== "en");
  }, []);

  return (
    <main className="not-found-page">
      <Image src="/assets/jahez/logo.jpg" alt="چاهِز" width={150} height={150} />
      <h1>{isArabic ? "حصلت مشكلة مؤقتة" : "Something went wrong"}</h1>
      <p>{isArabic ? "جربي تفتحي الصفحة مرة تانية." : "Please try opening the page again."}</p>
      <button className="button button-dark" onClick={reset}>
        {isArabic ? "حاولي تاني" : "Try again"}
      </button>
    </main>
  );
}
