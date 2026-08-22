"use client";

import Image from "next/image";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="not-found-page">
      <Image src="/assets/jahez/logo.jpg" alt="چاهِز" width={150} height={150} />
      <h1>حصلت مشكلة مؤقتة</h1>
      <p>جربي تفتحي الصفحة مرة تانية.</p>
      <button className="button button-dark" onClick={reset}>حاولي تاني</button>
    </main>
  );
}
