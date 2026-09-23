import { Navbar } from "@/components/www/navbar";
import { Footer } from "@/components/www/footer";

export default function WwwLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
