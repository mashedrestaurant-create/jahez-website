import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <Image src="/assets/jahez/logo.jpg" alt="چاهِز" width={150} height={150} />
      <h1>الصفحة دي مش موجودة</h1>
      <p>ارجعي للرئيسية أو شوفي المنيو.</p>
      <div><Link className="button button-dark" href="/">الرئيسية</Link><Link className="button button-primary" href="/menu">المنيو</Link></div>
    </main>
  );
}
